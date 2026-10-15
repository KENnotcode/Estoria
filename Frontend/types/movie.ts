import type { ImageSourcePropType } from 'react-native';

/**
 * Domain model for a movie as consumed by the UI layer.
 *
 * `releaseYear` and `runtime` are nullable because upstream list endpoints do
 * not always return them; screens must render those fields defensively.
 */
export type AppMovie = {
  id: string;
  title: string;
  releaseYear: number | null;
  releaseDate: string;
  runtime: number | null;
  rating: number;
  genres: string[];
  description: string;
  poster: ImageSourcePropType;
  backdrop: ImageSourcePropType;
};
