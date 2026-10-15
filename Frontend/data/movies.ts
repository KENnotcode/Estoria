import type { ImageSourcePropType } from 'react-native';

export type Movie = {
  id: string;
  title: string;
  releaseYear: number;
  runtime: number;
  rating: number;
  genres: string[];
  description: string;
  poster: ImageSourcePropType;
  backdrop: ImageSourcePropType;
};

const meridianPoster = require('../assets/images/poster-meridian.jpg');
const nightSignalPoster = require('../assets/images/poster-night-signal.jpg');
const orbitImage = require('../assets/images/hero-orbit.jpg');

export const movies: Movie[] = [
  {
    id: 'meridian',
    title: 'Meridian',
    releaseYear: 2026,
    runtime: 118,
    rating: 8.4,
    genres: ['Drama', 'Mystery'],
    description: 'A cartographer follows a vanished expedition into a landscape that refuses to stay still.',
    poster: meridianPoster,
    backdrop: orbitImage,
  },
  {
    id: 'night-signal',
    title: 'Night Signal',
    releaseYear: 2025,
    runtime: 104,
    rating: 8.1,
    genres: ['Sci-Fi', 'Thriller'],
    description: 'A radio astronomer hears a message that seems to predict the next day on Earth.',
    poster: nightSignalPoster,
    backdrop: orbitImage,
  },
  {
    id: 'orbit',
    title: 'Orbit',
    releaseYear: 2024,
    runtime: 126,
    rating: 7.9,
    genres: ['Adventure', 'Drama'],
    description: 'Two astronauts must choose between a safe return and one final impossible rescue.',
    poster: orbitImage,
    backdrop: orbitImage,
  },
];

export const featuredMovie = movies[0];
export const genres = ['All', ...Array.from(new Set(movies.flatMap((movie) => movie.genres)))];
