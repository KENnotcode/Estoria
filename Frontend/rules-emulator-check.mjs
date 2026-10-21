/**
 * Rules integration check for Backend/firestore.rules.
 *
 * Runs the exact client flows (signup create, profile-setup merge update,
 * merge-create race, favorites, reviews) against the local emulator suite:
 *
 *   cd Backend && npx firebase emulators:exec --only firestore,auth \
 *     --project demo-estoria "node ../Frontend/rules-emulator-check.mjs"
 *
 * Temporary validation helper — safe to delete once the rules are deployed.
 */
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  Timestamp,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const app = initializeApp({ projectId: 'demo-estoria', apiKey: 'demo-api-key' });
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

let pass = 0;
let fail = 0;

function record(name, ok, detail = '') {
  if (ok) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.log(`FAIL  ${name} ${detail}`);
  }
}

async function expectAllowed(name, fn) {
  try {
    await fn();
    record(name, true);
  } catch (error) {
    record(name, false, `unexpected error: ${error.code ?? error.message}`);
  }
}

async function expectDenied(name, fn) {
  try {
    await fn();
    record(name, false, 'operation was ALLOWED but should be denied');
  } catch (error) {
    if (error.code === 'permission-denied') {
      record(name, true);
    } else {
      record(name, false, `wrong error: ${error.code ?? error.message}`);
    }
  }
}

async function signedInUser(label) {
  const email = `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  const credential = await createUserWithEmailAndPassword(auth, email, 'password123');
  return { uid: credential.user.uid, email };
}

// 1. Signup writes the full profile including the new fields.
const userA = await signedInUser('alpha');
await expectAllowed('signup profile create (full shape, new fields)', () =>
  setDoc(doc(db, 'users', userA.uid), {
    displayName: 'Alpha Tester',
    email: userA.email,
    role: 'user',
    favoriteGenres: [],
    isProfileComplete: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }),
);

// 2. Profile-setup sheet completes the profile (merge update on existing doc).
await expectAllowed('complete profile merge update (existing doc)', () =>
  setDoc(
    doc(db, 'users', userA.uid),
    {
      displayName: 'Alpha Tester',
      photoURL: null,
      favoriteGenres: ['Action', 'Drama'],
      isProfileComplete: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  ),
);
const alphaSnap = await getDoc(doc(db, 'users', userA.uid));
record(
  'completion fields persisted',
  alphaSnap.exists()
    && alphaSnap.data().isProfileComplete === true
    && Array.isArray(alphaSnap.data().favoriteGenres)
    && alphaSnap.data().favoriteGenres.length === 2,
  JSON.stringify(alphaSnap.data() ?? null),
);

// 3. Legacy profile (pre-feature shape) + THE failing call: setup completion.
const userB = await signedInUser('bravo');
await expectAllowed('legacy profile create (no new fields)', () =>
  setDoc(doc(db, 'users', userB.uid), {
    displayName: 'Bravo Tester',
    email: userB.email,
    role: 'user',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }),
);
await expectAllowed('complete profile merge update (legacy doc)', () =>
  setDoc(
    doc(db, 'users', userB.uid),
    {
      displayName: 'Bravo Tester',
      photoURL: null,
      favoriteGenres: ['Sci-Fi'],
      isProfileComplete: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  ),
);
const bravoSnap = await getDoc(doc(db, 'users', userB.uid));
record(
  'legacy doc completion persisted',
  bravoSnap.exists() && bravoSnap.data().isProfileComplete === true
    && bravoSnap.data().email === userB.email
    && bravoSnap.data().createdAt != null,
  JSON.stringify(bravoSnap.data() ?? null),
);

// 4. Update path used by updateUserProfile (displayName only) on a legacy doc.
await expectAllowed('updateUserProfile displayName-only patch', () =>
  updateDoc(doc(db, 'users', userB.uid), {
    displayName: 'Bravo Renamed',
    updatedAt: serverTimestamp(),
  }),
);

// 5. The merge-create race: setup sheet runs before the signup doc landed.
const userC = await signedInUser('charlie');
await expectAllowed('setup sheet merge-create (missing doc)', () =>
  setDoc(
    doc(db, 'users', userC.uid),
    {
      displayName: 'Charlie Tester',
      photoURL: null,
      favoriteGenres: [],
      isProfileComplete: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  ),
);

// 6. Security: privilege escalation and immutable fields stay denied.
const userD = await signedInUser('delta');
await expectDenied('create own profile with admin role', () =>
  setDoc(doc(db, 'users', userD.uid), {
    displayName: 'Delta Tester',
    email: userD.email,
    role: 'admin',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }),
);
await expectAllowed('seed normal profile for delta', () =>
  setDoc(doc(db, 'users', userD.uid), {
    displayName: 'Delta Tester',
    email: userD.email,
    role: 'user',
    favoriteGenres: [],
    isProfileComplete: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }),
);
await expectDenied('update own email', () =>
  updateDoc(doc(db, 'users', userD.uid), { email: 'hijacked@example.com' }),
);
await expectDenied('update own role', () =>
  updateDoc(doc(db, 'users', userD.uid), { role: 'admin' }),
);
await expectDenied('update own createdAt', () =>
  updateDoc(doc(db, 'users', userD.uid), { createdAt: serverTimestamp() }),
);

// 7. Ownership boundary.
await expectDenied("read another user's profile", () => getDoc(doc(db, 'users', userB.uid)));

// 8. Favorites.
// Re-sign in as userA: userD was signed in at line 175, but favorites live
// under userA.uid, so the owning user must be the authenticated one.
await signInWithEmailAndPassword(auth, userA.email, 'password123');
const favoriteRef = doc(db, 'users', userA.uid, 'favorites', '123');
await expectAllowed('favorite create (own)', () =>
  setDoc(favoriteRef, { movieId: '123', addedAt: Timestamp.fromDate(new Date()) }),
);
await expectAllowed('favorite list (own)', () =>
  getDocs(query(collection(db, 'users', userA.uid, 'favorites'), orderBy('addedAt', 'desc'))),
);
await expectDenied("favorite list (someone else's)", () =>
  getDocs(query(collection(db, 'users', userB.uid, 'favorites'), orderBy('addedAt', 'desc'))),
);
await expectAllowed('favorite delete (own)', () => deleteDoc(favoriteRef));

// 9. Reviews: published list query is readable; direct client writes are not.
await expectAllowed('reviews published list query (empty is fine)', () =>
  getDocs(
    query(
      collection(db, 'reviews'),
      where('movieId', '==', '123'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(20),
    ),
  ),
);
await expectDenied('review direct client create', () =>
  setDoc(doc(db, 'reviews', 'review-should-be-denied'), {
    movieId: '123',
    userId: userA.uid,
    displayName: 'Alpha Tester',
    rating: 9,
    text: 'Great movie.',
    status: 'published',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }),
);

// 10. Rate-limit markers are invisible to clients.
await expectDenied('rateLimits marker read', () => getDoc(doc(db, 'rateLimits', userA.uid)));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
