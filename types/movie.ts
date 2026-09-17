import { ImageSourcePropType } from 'react-native';

export type ImageSource = ImageSourcePropType | { uri: string };

export type AppMovie = {
  id: string;
  title: string;
  releaseYear: number;
  runtime: number;
  rating: number;
  genres: string[];
  description: string;
  poster: ImageSource;
  backdrop: ImageSource;
};