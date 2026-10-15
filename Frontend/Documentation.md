# Estoria - Complete Project Documentation

> **Purpose:** This document explains the Estoria mobile application in simple terms. It explains what the folders, files, commands, technologies, and common programming terms are for, how the application flows, and how group members should work with the code.

---

# Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Important Project Words](#4-important-project-words)
5. [Application Architecture](#5-application-architecture)
6. [Expo and React Native](#6-expo-and-react-native)
7. [Expo Router and Navigation](#7-expo-router-and-navigation)
8. [`src/app/` - Screens and Routes](#8-srcapp---screens-and-routes)
9. [`components/` - Reusable UI](#9-components---reusable-ui)
10. [`constants/` - Shared Values](#10-constants---shared-values)
11. [`context/` - Shared State](#11-context---shared-state)
12. [`data/` - Local and Static Data](#12-data---local-and-static-data)
13. [`hooks/` - Reusable Logic](#13-hooks---reusable-logic)
14. [`services/` - API and Data Operations](#14-services---api-and-data-operations)
15. [`types/` - TypeScript Types](#15-types---typescript-types)
16. [`assets/` - Images and Static Files](#16-assets---images-and-static-files)
17. [Environment Variables](#17-environment-variables)
18. [`package.json`](#18-packagejson)
19. [Development Commands](#19-development-commands)
20. [How the App Starts](#20-how-the-app-starts)
21. [General Screen Flow](#21-general-screen-flow)
22. [Movie Data Flow](#22-movie-data-flow)
23. [Search Flow](#23-search-flow)
24. [Movie Details Flow](#24-movie-details-flow)
25. [State and Context Flow](#25-state-and-context-flow)
26. [React Query](#26-react-query)
27. [AsyncStorage](#27-asyncstorage)
28. [Understanding React Native Code](#28-understanding-react-native-code)
29. [How to Read an Estoria File](#29-how-to-read-an-estoria-file)
30. [How to Add a New Screen](#30-how-to-add-a-new-screen)
31. [How to Add a New Component](#31-how-to-add-a-new-component)
32. [How to Add a New API Feature](#32-how-to-add-a-new-api-feature)
33. [Loading, Error, and Empty States](#33-loading-error-and-empty-states)
34. [Navigation Guidelines](#34-navigation-guidelines)
35. [Git and GitHub Workflow](#35-git-and-github-workflow)
36. [Branching](#36-branching)
37. [Commits](#37-commits)
38. [Pull Requests](#38-pull-requests)
39. [Debugging Guide](#39-debugging-guide)
40. [Dependency Management](#40-dependency-management)
41. [Code Organization Rules](#41-code-organization-rules)
42. [How New Group Members Should Learn the Project](#42-how-new-group-members-should-learn-the-project)
43. [Quick Reference](#43-quick-reference)
44. [Team Checklist](#44-team-checklist)

---

# 1. Project Overview

**Estoria** is a mobile movie application built using:

```text
Expo
React Native
TypeScript
Expo Router
React Query
AsyncStorage
Expo modules
```

The project is designed using separate folders for different responsibilities.

The main idea is:

```text
Screens
   ↓
Components
   ↓
Hooks / Context
   ↓
Services
   ↓
API / Data
```

Each part has a different job.

This makes the project easier for several people to work on at the same time.

---

# 2. Technology Stack

## Expo

**Expo** is the development platform used to build and run Estoria.

It provides tools that make React Native development easier.

It is used for things such as:

```text
Starting the application
Running Android
Running iOS
Running Web
Accessing device features
Managing application configuration
```

---

## React Native

**React Native** is the framework used to create Estoria's mobile interface.

Instead of creating a completely separate interface for Android and iOS, React Native allows developers to build the interface using React components.

Example:

```tsx
<View>
  <Text>Welcome to Estoria</Text>
</View>
```

`View` is a container.

`Text` displays text.

---

## TypeScript

**TypeScript** is the programming language used in the project.

It is based on JavaScript but adds types.

Example:

```ts
const title: string = "Interstellar";
const year: number = 2014;
```

The type tells the developer what kind of value should be stored.

This helps catch mistakes while developing the application.

---

## Expo Router

**Expo Router** controls the navigation of the application.

It uses the file structure inside `src/app/` to determine application routes.

The basic idea is:

```text
File
 ↓
Route
 ↓
Screen
```

---

## React Query

The project includes:

```text
@tanstack/react-query
```

React Query helps manage data that comes from APIs or other asynchronous sources.

It can handle:

```text
Loading
Success
Errors
Caching
Refetching
```

---

## AsyncStorage

The project includes:

```text
@react-native-async-storage/async-storage
```

AsyncStorage is used for storing appropriate non-sensitive information locally on the user's device.

For example:

```text
Preferences
Saved settings
Persisted local state
```

It should not be treated as secure storage for passwords or secrets.

---

# 3. Project Structure

The current top-level structure is organized approximately like this:

```text
Estoria/
│
├── .claude/
├── .vscode/
│
├── assets/
├── components/
├── constants/
├── context/
├── data/
├── hooks/
├── services/
│
├── src/
│   └── app/
│
├── types/
│
├── .env
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── LICENSE
├── README.md
├── app.json
├── package.json
├── package-lock.json
└── tsconfig.json
```

The important folders are:

```text
src/app/      → Screens and navigation
components/   → Reusable UI components
constants/    → Shared fixed values
context/      → Shared application state
data/         → Local/static data
hooks/        → Reusable React logic
services/     → API/data operations
types/        → TypeScript types
assets/       → Images, fonts, and other static files
```

---

# 4. Important Project Words

This section explains common words you will see while reading the Estoria code.

## Component

A **component** is a reusable part of the user interface.

Example:

```text
Movie Card
Search Bar
Button
Header
Poster
Rating
```

A component can be reused on multiple screens.

```text
Home
  ↓
MovieCard

Search
  ↓
MovieCard

Favorites
  ↓
MovieCard
```

---

## Screen

A **screen** is a complete page that the user can navigate to.

Examples:

```text
Home
Search
Movie Details
Profile
Favorites
```

Screens are normally represented inside:

```text
src/app/
```

---

## Route

A **route** identifies where the user is in the application.

Expo Router connects files to routes.

```text
src/app/
     ↓
Routes
     ↓
Screens
```

---

## Props

**Props** are information passed into a component.

Example:

```tsx
<MovieCard movie={movie} />
```

Here:

```text
movie
```

is a prop.

The same component can receive different movies:

```text
MovieCard → Interstellar
MovieCard → Inception
MovieCard → Avatar
```

---

## State

**State** is information that can change while the application is running.

Example:

```tsx
const [searchText, setSearchText] = useState("");
```

There are two parts:

```text
searchText
    ↓
Current value

setSearchText()
    ↓
Changes the value
```

When the state changes, React can update the screen.

---

## Hook

A **hook** is a function that provides reusable React logic.

Examples of built-in React hooks:

```text
useState()
useEffect()
```

Estoria can also have custom hooks inside:

```text
hooks/
```

A custom hook can handle things such as:

```text
Fetching movies
Searching
Favorites
Authentication
Shared logic
```

---

## Context

**Context** is used to share information across multiple parts of the application.

Without Context:

```text
Screen
 ↓
Component
 ↓
Component
 ↓
Component
```

With Context:

```text
Context
 ├── Screen
 ├── Screen
 └── Component
```

This is useful for information that many screens need.

---

## Service

A **service** is responsible for performing a specific operation.

In Estoria, services can be used for:

```text
API requests
Movie data
Authentication
External services
Data transformation
```

A common flow is:

```text
Screen
 ↓
Hook
 ↓
Service
 ↓
API
```

---

## API

**API** means Application Programming Interface.

It allows Estoria to communicate with an external server.

Example:

```text
Estoria
   ↓
API Request
   ↓
Movie Server
   ↓
Movie Data
   ↓
Estoria
```

---

## JSON

**JSON** is a common format for sending data between applications.

Example:

```json
{
  "id": 123,
  "title": "Interstellar",
  "year": 2014
}
```

This represents one movie.

---

## Dependency

A **dependency** is an external package that the application uses.

Examples:

```text
expo
react
react-native
expo-router
@tanstack/react-query
```

Dependencies are listed in:

```text
package.json
```

---

## npm

**npm** stands for Node Package Manager.

It is used to:

```text
Install packages
Run project scripts
Manage dependencies
```

Example:

```bash
npm install
```

---

## Git

**Git** is the version control system used to track changes.

It allows the team to:

```text
Save versions
Create branches
View changes
Merge work
Undo changes
Collaborate
```

---

## GitHub

**GitHub** hosts the online Estoria repository.

Repository:

```text
https://github.com/KENnotcode/Estoria
```

Git works on your computer.

GitHub stores the shared online repository.

---

# 5. Application Architecture

Estoria separates different responsibilities.

A simplified architecture looks like this:

```text
                    USER
                      │
                      ▼
                  SCREEN
                src/app/
                      │
             ┌────────┴────────┐
             ▼                 ▼
        COMPONENT            HOOK
       components/           hooks/
             │                 │
             │                 ▼
             │              CONTEXT
             │              context/
             │                 │
             └────────┬────────┘
                      ▼
                  SERVICE
                 services/
                      │
              ┌───────┴───────┐
              ▼               ▼
            DATA             API
          data/          External Server
```

The important rule is:

```text
Screen       → Displays and connects the page
Component    → Handles reusable UI
Hook         → Handles reusable logic
Context      → Handles shared state
Service      → Handles API/data operations
Data         → Holds local/static data
Types        → Defines data structures
Constants    → Holds shared fixed values
Assets       → Holds images and static files
```

---

# 6. Expo and React Native

## What is `View`?

`View` is one of the most common React Native components.

It works like a container.

Example:

```tsx
<View>
  <Text>Estoria</Text>
</View>
```

The `View` contains the `Text`.

---

## What is `Text`?

`Text` displays words on the screen.

Example:

```tsx
<Text>Welcome to Estoria</Text>
```

---

## What is `Image`?

`Image` displays an image.

Example:

```tsx
<Image source={poster} />
```

In a movie application, this can be used to display movie posters.

---

## What is `Pressable`?

`Pressable` makes an element respond to user interaction.

Example:

```tsx
<Pressable onPress={handlePress}>
  <Text>View Movie</Text>
</Pressable>
```

When the user presses the element, `handlePress` runs.

---

## What is `ScrollView`?

`ScrollView` allows content to be scrolled.

It is useful for screens containing content longer than the phone's screen.

---

## What is `FlatList`?

`FlatList` is used to efficiently display lists of data.

For a movie application:

```text
Movie 1
Movie 2
Movie 3
Movie 4
Movie 5
```

A `FlatList` can render the movies without manually writing the same component repeatedly.

---

# 7. Expo Router and Navigation

Expo Router uses the file structure to control navigation.

The basic concept is:

```text
File
 ↓
Route
 ↓
Screen
```

For example, a file inside `src/app/` can represent a route.

Dynamic routes can also use route parameters.

A movie details page may need:

```text
Movie ID
```

The flow can be:

```text
User selects movie
       ↓
Movie ID
       ↓
Movie Details route
       ↓
Movie Details screen
```

### Important rule

Before changing navigation, inspect:

```text
src/app/
```

and understand the existing route structure.

Do not introduce another navigation system without a reason.

---

# 8. `src/app/` - Screens and Routes

This folder is the main application routing area.

The files here represent screens/routes.

Conceptually:

```text
src/app/
   │
   ├── Home
   ├── Search
   ├── Movie Details
   └── Other screens
```

The exact filenames in the repository are the source of truth for the current navigation structure.

## What should go here?

Put files here when they represent a user-accessible screen or route.

## What should not go here?

Reusable UI should normally go in:

```text
components/
```

Reusable logic should normally go in:

```text
hooks/
```

API operations should normally go in:

```text
services/
```

---

# 9. `components/` - Reusable UI

The `components/` folder contains reusable interface elements.

Examples:

```text
MovieCard
Button
Header
SearchBar
Rating
MoviePoster
```

The purpose is to avoid repeating the same UI code.

Instead of:

```text
Home → manually creates movie card
Search → manually creates movie card
Favorites → manually creates movie card
```

we can have:

```text
MovieCard component
       ↑
       ├── Home
       ├── Search
       └── Favorites
```

---

# 10. `constants/` - Shared Values

The `constants/` folder stores values that are reused throughout the application.

Examples:

```text
Colors
Font sizes
Spacing
Labels
Configuration
```

Instead of writing a value repeatedly:

```text
Screen A → value
Screen B → value
Screen C → value
```

a shared constant can be used:

```text
constants/
    ↓
Screen A
Screen B
Screen C
```

This makes the interface easier to keep consistent.

---

# 11. `context/` - Shared State

The `context/` folder contains shared React Context logic.

Context is useful when multiple screens need the same information.

For example:

```text
Current user
Favorites
Theme
Preferences
Application state
```

The general structure is:

```text
Context Provider
       │
       ├── Home
       ├── Search
       ├── Movie Details
       └── Profile
```

Do not put every state variable into Context.

Use local state when only one component needs the information.

---

# 12. `data/` - Local and Static Data

The `data/` folder contains local or static application data.

This can include:

```text
Movie data
Categories
Sample content
Static lists
Local configuration data
```

The general flow is:

```text
data/
 ↓
hook/service
 ↓
screen
 ↓
component
 ↓
UI
```

If data already exists in this folder, do not create another duplicate copy inside a screen.

---

# 13. `hooks/` - Reusable Logic

The `hooks/` folder contains reusable React hooks.

A hook can contain logic such as:

```text
Fetching movies
Searching
Favorites
Authentication
Loading states
Error handling
```

Instead of making a screen responsible for everything:

```text
Screen
 ├── API request
 ├── State
 ├── Loading
 ├── Error
 ├── Filtering
 └── UI
```

logic can be separated:

```text
Screen
   ↓
useMovies()
   ↓
Movie logic
```

This keeps screens easier to read.

---

# 14. `services/` - API and Data Operations

The `services/` folder contains operations that communicate with data sources.

Examples:

```text
Movie API
Search API
Authentication service
Favorite service
```

A common structure is:

```text
Screen
  ↓
Hook
  ↓
Service
  ↓
API
  ↓
Response
  ↓
Hook
  ↓
Screen
```

This keeps API code separate from UI code.

---

# 15. `types/` - TypeScript Types

The `types/` folder contains TypeScript types and interfaces.

Types describe what a piece of data should look like.

For example:

```ts
type Movie = {
  id: number;
  title: string;
};
```

This tells TypeScript that a movie has:

```text
id    → number
title → text
```

Types are shared between different parts of the application.

For example:

```text
API
 ↓
Movie type
 ↓
Hook
 ↓
Screen
 ↓
MovieCard
```

Avoid creating multiple versions of the same type.

---

# 16. `assets/` - Images and Static Files

The `assets/` folder stores static files.

Examples:

```text
Images
Icons
Fonts
Logos
Splash screen assets
```

Assets are files used by the application but are not normally generated by the application itself.

---

# 17. Environment Variables

The project contains:

```text
.env
```

Environment variables are values stored outside normal source code.

Examples:

```text
API_URL
API_KEY
Service configuration
```

Instead of writing a key directly in code:

```ts
const apiKey = "secret-value";
```

the application can read configuration from an environment variable.

### Important

Do not commit private secrets to GitHub.

Before pushing code, check whether your `.env` file contains:

```text
API keys
Private tokens
Passwords
Secret credentials
```

If it does, make sure the file is ignored by Git and share the required values securely with group members.

---

# 18. `package.json`

`package.json` is one of the most important files in the project.

It tells npm:

```text
What the project is
What packages it needs
What commands it can run
What the application entry point is
```

The project uses:

```json
"main": "expo-router/entry"
```

This tells Expo to use Expo Router as the application's entry point.

---

## Dependencies

The `dependencies` section lists packages needed by the application.

Examples include:

```text
expo
react
react-native
expo-router
@tanstack/react-query
@react-native-async-storage/async-storage
```

---

## Scripts

The `scripts` section contains commands that can be run using npm.

Instead of typing long commands, npm allows us to use:

```bash
npm start
```

or:

```bash
npm run android
```

---

# 19. Development Commands

## `npm install`

```bash
npm install
```

**What it is for:**

Downloads and installs the packages required by Estoria.

You normally run this after:

```text
Cloning the repository
Pulling a project for the first time
Installing dependencies after package changes
```

The process is:

```text
package.json
      ↓
npm install
      ↓
node_modules/
      ↓
Packages installed
```

---

## `npm start`

```bash
npm start
```

**What it is for:**

Starts the Expo development server.

This is normally the first command used when developing Estoria.

The process is:

```text
npm start
    ↓
Expo starts
    ↓
Development server
    ↓
Open Estoria on a device/emulator/browser
```

---

## `npm run android`

```bash
npm run android
```

**What it is for:**

Runs Estoria on an Android device or Android emulator.

Use this when testing the Android version.

---

## `npm run ios`

```bash
npm run ios
```

**What it is for:**

Runs Estoria on an iOS device or iOS simulator.

This normally requires the appropriate Apple development environment.

---

## `npm run web`

```bash
npm run web
```

**What it is for:**

Runs Estoria in a web browser.

This is useful for quickly testing interface changes without opening a mobile emulator.

---

## `npm run lint`

```bash
npm run lint
```

**What it is for:**

Checks the code for problems according to the project's linting rules.

It can detect issues such as:

```text
Unused variables
Incorrect imports
Some common coding mistakes
Code style violations
```

Run it before committing your work.

---

## Quick Command Guide

| Command | What it does |
|---|---|
| `npm install` | Installs project dependencies |
| `npm start` | Starts the Expo development server |
| `npm run android` | Runs the Android version |
| `npm run ios` | Runs the iOS version |
| `npm run web` | Runs the web version |
| `npm run lint` | Checks the code for linting problems |

---

# 20. How the App Starts

The application startup process can be understood like this:

```text
User runs:

npm start
     ↓
Expo starts
     ↓
package.json
     ↓
expo-router/entry
     ↓
Expo Router
     ↓
src/app/
     ↓
Initial route
     ↓
Screen
     ↓
Components / Hooks / Context / Services
     ↓
UI appears
```

The first files to inspect when learning the startup process are:

```text
package.json
app.json
src/app/
```

---

# 21. General Screen Flow

A movie application normally follows a structure similar to:

```text
                 App
                  │
                  ▼
                Home
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
      Search    Movie      Profile
                 Details
                   │
                   ▼
               Movie Info
```

A typical movie selection works like this:

```text
User sees movie
      ↓
User taps movie
      ↓
Press event runs
      ↓
Navigation happens
      ↓
Movie ID is passed
      ↓
Movie Details screen opens
      ↓
Movie information is shown
```

---

# 22. Movie Data Flow

Movie data should generally move through the application like this:

```text
Movie API / Local Data
          ↓
       Service
          ↓
         Hook
          ↓
        Screen
          ↓
      MovieCard
          ↓
           UI
```

For example:

```ts
const movies = await movieService.getMovies();
```

The service obtains the data.

The hook can manage the data:

```ts
const {
  movies,
  loading,
  error
} = useMovies();
```

The screen then displays it.

```tsx
{movies.map(movie => (
  <MovieCard
    key={movie.id}
    movie={movie}
  />
))}
```

---

# 23. Search Flow

The search feature can be understood as:

```text
User types search
        ↓
Search state changes
        ↓
Search hook
        ↓
Movie service
        ↓
API
        ↓
Search results
        ↓
Screen updates
        ↓
Movie cards display
```

The important separation is:

```text
Search UI
    ≠
Search API logic
```

The search field is responsible for user input.

The service is responsible for communicating with the data source.

The hook connects the two and manages the state.

---

# 24. Movie Details Flow

When the user selects a movie:

```text
MovieCard
   ↓
User presses card
   ↓
Navigation
   ↓
Movie ID
   ↓
Movie Details route
   ↓
Movie Details screen
   ↓
Movie data
   ↓
Details UI
```

Using the movie ID is useful because the details screen knows exactly which movie it needs.

---

# 25. State and Context Flow

Shared state can work like this:

```text
                Context
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
      Home       Search     Profile
        │          │          │
        └──────────┼──────────┘
                   ▼
              Shared State
```

For example, if Estoria has a favorites/watchlist feature:

```text
User presses Favorite
        ↓
Favorite state changes
        ↓
Context updates
        ↓
Other screens receive new state
        ↓
UI updates
```

---

# 26. React Query

React Query helps manage data that comes from asynchronous sources.

A simplified flow:

```text
Screen
  ↓
Query
  ↓
Service
  ↓
API
  ↓
Response
  ↓
React Query
  ↓
Screen
```

React Query can manage:

### Loading

```text
The request is still running.
```

### Success

```text
The data was successfully received.
```

### Error

```text
The request failed.
```

### Cache

```text
Previously received data can be kept temporarily
so the application does not always need to request
the same data again.
```

### Refetch

```text
The application can request updated data again.
```

---

# 27. AsyncStorage

AsyncStorage stores appropriate information locally on the device.

The basic idea is:

```text
Application
     ↓
AsyncStorage
     ↓
Device storage
```

For example, an application preference can be saved.

When the application starts again:

```text
Application starts
     ↓
Read AsyncStorage
     ↓
Retrieve saved value
     ↓
Use it in the application
```

### Important security note

Do not use normal AsyncStorage as a secure password vault.

Sensitive credentials should use an appropriate secure-storage solution if the application requires them.

---

# 28. Understanding React Native Code

## `import`

`import` brings code from another file or package.

Example:

```tsx
import { View, Text } from "react-native";
```

This allows the file to use:

```text
View
Text
```

Another example:

```tsx
import MovieCard from "@/components/MovieCard";
```

This imports an Estoria component.

---

## `export`

`export` makes code available to other files.

Example:

```tsx
export function MovieCard() {
  ...
}
```

Another file can then import it.

```tsx
import { MovieCard } from "@/components/MovieCard";
```

The simple relationship is:

```text
export
  ↓
Makes code available

import
  ↓
Uses the code
```

---

## `.tsx`

A `.tsx` file is normally used for TypeScript files that contain JSX.

Examples:

```text
Home.tsx
MovieCard.tsx
Search.tsx
```

These files can contain both:

```text
TypeScript
+
React UI
```

---

## `.ts`

A `.ts` file contains TypeScript without JSX.

It is commonly used for:

```text
Services
Hooks
Types
Constants
Utilities
Data
```

---

## `useState`

`useState` creates a piece of state.

Example:

```tsx
const [count, setCount] = useState(0);
```

This creates:

```text
count
    ↓
Current value

setCount()
    ↓
Changes count
```

---

## `useEffect`

`useEffect` runs code based on component lifecycle or changes in values.

A common use is performing an operation when a screen loads.

Conceptually:

```text
Screen loads
    ↓
useEffect runs
    ↓
Perform operation
```

Do not use `useEffect` automatically for every operation. First understand whether the existing project uses another pattern, such as React Query.

---

## `async`

`async` marks a function as asynchronous.

Example:

```ts
async function loadMovies() {
  ...
}
```

This is commonly used when the function performs an API request.

---

## `await`

`await` waits for an asynchronous operation to finish.

Example:

```ts
const movies = await getMovies();
```

The meaning is approximately:

```text
Start getMovies()
       ↓
Wait for result
       ↓
Store result in movies
```

---

## `return`

`return` sends a value back from a function.

In a React component, `return` normally contains the UI.

Example:

```tsx
return (
  <View>
    <Text>Estoria</Text>
  </View>
);
```

This means the component returns the UI that should be displayed.

---

# 29. How to Read an Estoria File

When opening an unfamiliar file, do not immediately try to understand every line.

Use this order.

## Step 1 - Read the imports

Look at:

```tsx
import ...
```

Ask:

```text
What packages are being used?
What Estoria files are being used?
```

---

## Step 2 - Find the main function/component

Look for:

```tsx
export default function ...
```

or:

```tsx
function ...
```

This usually tells you what the file is responsible for.

---

## Step 3 - Look for state

Search for:

```text
useState
```

This tells you what information can change.

---

## Step 4 - Look for effects

Search for:

```text
useEffect
```

This can show you what happens when the component loads or when a value changes.

---

## Step 5 - Look for data

Search for:

```text
useQuery
fetch
service
hook
data
```

This tells you where the screen gets its information.

---

## Step 6 - Look for navigation

Search for:

```text
router
navigate
push
replace
Link
```

This tells you where the user can go next.

---

## Step 7 - Read the `return`

Find:

```tsx
return (
```

This is normally the most important part for understanding what the user sees.

---

# 30. How to Add a New Screen

When adding a screen, follow these steps.

## Step 1 - Check the existing routes

Open:

```text
src/app/
```

Understand how existing screens are organized.

---

## Step 2 - Create the route

Follow the naming convention already used by the project.

Do not create a completely different route structure.

---

## Step 3 - Identify the data

Ask:

```text
Where does this screen get its data?
```

It could come from:

```text
data/
services/
context/
hooks/
route parameters
```

---

## Step 4 - Check existing components

Before creating new UI, check:

```text
components/
```

You may already have a component that does what you need.

---

## Step 5 - Check existing types

Look inside:

```text
types/
```

Reuse existing types.

---

## Step 6 - Separate complex logic

If the screen contains a lot of logic, consider moving reusable logic to:

```text
hooks/
```

---

# 31. How to Add a New Component

Before creating a component:

```text
1. Search components/
2. Check whether an existing component can be reused
3. Check existing constants
4. Check existing types
```

A component should ideally have one clear responsibility.

For example:

```text
MovieCard
    ↓
Displays movie information
    ↓
Handles movie-card interaction
```

Avoid turning one component into the place where the entire application logic lives.

---

# 32. How to Add a New API Feature

A good structure is:

```text
1. Confirm the data type
        ↓
2. Create/update service
        ↓
3. Create/update hook
        ↓
4. Connect the screen
        ↓
5. Display the result
```

Example:

```text
Movie Search
     ↓
Search Type
     ↓
Movie Service
     ↓
useSearch()
     ↓
Search Screen
     ↓
MovieCard
```

This keeps the API logic separate from the interface.

---

# 33. Loading, Error, and Empty States

When working with API data, do not assume that the request will always succeed.

A screen should consider:

```text
Loading
Success
Error
Empty
```

## Loading

The request is still running.

Example:

```text
Loading movies...
```

---

## Success

The data was received.

Example:

```text
Movie list
```

---

## Error

The request failed.

Example:

```text
Unable to load movies.
```

---

## Empty

The request succeeded but there are no results.

Example:

```text
No movies found.
```

The complete flow is:

```text
Request
  ↓
Loading
  ↓
 ┌───────────────┬───────────────┐
 ▼               ▼               ▼
Success         Error           Empty
  ↓               ↓               ↓
Show data      Show error      Show message
```

---

# 34. Navigation Guidelines

When working with navigation:

1. Follow the existing Expo Router structure.
2. Check `src/app/` before creating a new route.
3. Use the project's existing navigation approach.
4. Pass the required information to the destination screen.
5. Handle missing parameters.
6. Test back navigation.

A simple flow should be:

```text
Home
 ↓
Movie Details
 ↓
Back
 ↓
Home
```

---

# 35. Git and GitHub Workflow

Git is used to track your code.

GitHub is where the shared repository is stored.

A normal workflow is:

```text
Pull latest code
      ↓
Create branch
      ↓
Make changes
      ↓
Test
      ↓
Commit
      ↓
Push
      ↓
Pull Request
      ↓
Review
      ↓
Merge
```

---

# 36. Branching

A **branch** is a separate line of development.

For example:

```text
main
 │
 ├── feature/search
 ├── feature/profile
 ├── feature/movie-details
 └── fix/navigation
```

Create a branch for your feature:

```bash
git checkout -b feature/search
```

The name should describe what you are working on.

Examples:

```bash
git checkout -b feature/search
git checkout -b feature/profile
git checkout -b feature/favorites
git checkout -b fix/movie-details
```

---

# 37. Commits

A **commit** is a saved checkpoint of your changes.

First:

```bash
git status
```

This shows which files changed.

Then:

```bash
git add .
```

This prepares the changes.

Then:

```bash
git commit -m "Add movie search"
```

This saves the changes into Git history.

Good commit messages:

```text
Add movie search screen
Fix movie details navigation
Update movie card layout
Add favorites state
```

Avoid messages like:

```text
changes
update
test
asdf
```

because they do not explain what was changed.

---

# 38. Pull Requests

A **Pull Request**, or PR, is a request to merge your branch into another branch.

Typical process:

```text
feature/search
      ↓
Push to GitHub
      ↓
Create Pull Request
      ↓
Groupmate reviews code
      ↓
Changes requested if needed
      ↓
Approved
      ↓
Merge
```

This is useful for group projects because another person can check the code before it becomes part of `main`.

---

# 39. Debugging Guide

## The application does not start

Try:

```bash
npm install
npm start
```

Then check the terminal for errors.

Also inspect:

```text
package.json
app.json
tsconfig.json
src/app/
```

---

## Navigation does not work

Check:

```text
src/app/
```

Then verify:

```text
Route filename
Route path
Parameter name
Navigation function
Destination route
```

---

## API data is missing

Follow the data flow backwards:

```text
Screen
  ↓
Hook
  ↓
Service
  ↓
Environment variables
  ↓
API
```

Check each part.

---

## TypeScript error

Check:

```text
Wrong type
Missing property
Wrong import
Undefined value
Incorrect function parameter
```

Then inspect:

```text
types/
```

before creating a new type.

---

## UI is not updating

Check:

```text
State
Context
Props
Hook
```

Ask:

```text
Did the state actually change?
Did the component receive the new prop?
Is the component using the correct context?
Is the hook returning the expected data?
```

---

# 40. Dependency Management

Before installing a new package:

```text
1. Check package.json
2. Check whether the project already has a package
   that can do the same thing
3. Check Expo compatibility
4. Install the package
5. Test the application
```

Do not install multiple packages that perform the same job without a reason.

For example, if the project already has a library for a specific purpose, use the existing solution unless there is a technical reason to replace it.

---

# 41. Code Organization Rules

## Rule 1 - Avoid duplicate logic

If the same logic appears in multiple screens, consider moving it into a hook or service.

---

## Rule 2 - Avoid duplicate types

Use the existing definitions in:

```text
types/
```

---

## Rule 3 - Reuse components

Before creating a new component, search:

```text
components/
```

---

## Rule 4 - Keep API calls organized

API/data operations should follow the existing service architecture.

Avoid scattering raw API calls throughout many UI components.

---

## Rule 5 - Keep screens readable

A screen should mainly:

```text
Receive/display data
Compose components
Handle screen-level interaction
Connect navigation
```

It should not become the location for every piece of application logic.

---

## Rule 6 - Do not commit secrets

Be careful with:

```text
.env
API keys
Tokens
Passwords
Private credentials
```

---

## Rule 7 - Follow existing naming conventions

If existing files use a particular naming style, follow it.

Consistency makes the project easier to understand.

---

## Rule 8 - Test your changes

At minimum:

```bash
npm run lint
npm start
```

Then manually test the feature you changed.

---

# 42. How New Group Members Should Learn the Project

If someone is new to Estoria, use this order:

```text
1. README.md
       ↓
2. package.json
       ↓
3. app.json
       ↓
4. src/app/
       ↓
5. components/
       ↓
6. context/
       ↓
7. hooks/
       ↓
8. services/
       ↓
9. data/
       ↓
10. types/
       ↓
11. assets/
```

Why this order?

```text
README
  ↓
Understand the project

package.json
  ↓
Understand dependencies and commands

app.json
  ↓
Understand Expo configuration

src/app/
  ↓
Understand screens/navigation

components/
  ↓
Understand reusable UI

context/hooks
  ↓
Understand application logic/state

services/data
  ↓
Understand where data comes from

types
  ↓
Understand data structures

assets
  ↓
Understand images/static resources
```

---

# 43. Quick Reference

When you are looking for something, use this guide.

| If you are looking for... | Check... |
|---|---|
| A screen | `src/app/` |
| Navigation | `src/app/` |
| Reusable UI | `components/` |
| Shared state | `context/` |
| Reusable logic | `hooks/` |
| API operations | `services/` |
| Local/static data | `data/` |
| Shared values | `constants/` |
| Data structures | `types/` |
| Images/fonts | `assets/` |
| Dependencies | `package.json` |
| Expo configuration | `app.json` |
| TypeScript configuration | `tsconfig.json` |
| Git ignored files | `.gitignore` |
| Project documentation | `README.md` |

---

# 44. Team Checklist

Before submitting your changes:

```text
[ ] I know which folder my change belongs to.

[ ] I checked whether an existing component can be reused.

[ ] I checked the existing types.

[ ] I did not duplicate existing logic.

[ ] I did not put unnecessary API logic inside UI components.

[ ] I did not commit API keys, passwords, or secrets.

[ ] I tested the affected screen.

[ ] I tested the navigation.

[ ] I checked loading/error/empty states if applicable.

[ ] I ran npm run lint.

[ ] I created a clear Git commit.

[ ] I pushed the correct branch.

[ ] I created a Pull Request when appropriate.
```

---

# Final Mental Model

The easiest way to remember the Estoria project is:

```text
                 USER
                   │
                   ▼
               src/app/
             "Where do I go?"
                   │
                   ▼
              components/
             "What do I see?"
                   │
                   ▼
                hooks/
            "What does it do?"
                   │
                   ▼
                context/
          "What is shared?"
                   │
                   ▼
              services/
           "Where is data from?"
                   │
             ┌─────┴─────┐
             ▼           ▼
           data/        API
             │
             ▼
           types/
      "What does data look like?"
```

Remember these simple meanings:

```text
src/app/     → Screens and routes
components/  → Reusable UI
hooks/       → Reusable logic
context/     → Shared state
services/    → API/data operations
data/        → Local/static data
types/       → Data structures
constants/   → Shared fixed values
assets/      → Images and static files
```

The main rule for the team is:

> **Keep each part responsible for one job.**

If you are unsure where new code belongs, ask:

```text
Is it a screen?
       → src/app/

Is it reusable UI?
       → components/

Is it reusable logic?
       → hooks/

Is it shared state?
       → context/

Does it communicate with an API?
       → services/

Is it local/static data?
       → data/

Is it a TypeScript type?
       → types/

Is it a shared value?
       → constants/

Is it an image/font/static file?
       → assets/
```

Following this structure will make Estoria easier for the whole group to understand, maintain, debug, and develop.

---

## Repository

Estoria GitHub repository:

```text
https://github.com/KENnotcode/Estoria
```

## Project Stack

```text
Framework       → Expo
Mobile UI       → React Native
Language        → TypeScript
Navigation      → Expo Router
Server Data     → React Query
Local Storage   → AsyncStorage
Package Manager → npm
Version Control → Git
Repository      → GitHub
```

**End of Documentation**
