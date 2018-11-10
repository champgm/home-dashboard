import { Router } from 'express';
import bunyan from 'bunyan';
import { asyncHandler } from '../common/Util';
import fs from 'fs';

const favoritesFilePath = `${__dirname}/../Favorites.json`;
export function readFavoritesFile() {
  return JSON.parse(fs.readFileSync(favoritesFilePath, 'UTF8'));
}
export function writeFavoritesFile(favorites) {
  fs.writeFileSync(favoritesFilePath, JSON.stringify(favorites), 'UTF8');
}
export function removeFavorite(id: string, type: string) {
  const favorites = readFavoritesFile();
  if (favorites[type].indexOf(id) > -1) {
    favorites[type].splice(favorites[type].indexOf(id), 1);
  }
  writeFavoritesFile(favorites);
}
export function putFavorite(id: string, type: string) {
  const favorites = readFavoritesFile();
  if (favorites[type].indexOf(id) === -1) {
    favorites[type].push(id);
  }
  writeFavoritesFile(favorites);
}

export function routeFavoritesEndpoints(router: Router, logger: bunyan) {
  router.get('/favorites', asyncHandler(async (request, response) => {
    return { code: 200, payload: readFavoritesFile() };
  }));

  router.put('/favorites/lights/:id', asyncHandler(async (request, response) => {
    const id = request.params.id;
    putFavorite(id, 'lights');
    return { code: 200 };
  }));

  router.delete('/favorites/groups/:id', asyncHandler(async (request, response) => {
    const id = request.params.id;
    removeFavorite(id, 'groups');
    return { code: 200 };
  }));

  router.put('/favorites/groups/:id', asyncHandler(async (request, response) => {
    const id = request.params.id;
    putFavorite(id, 'groups');
    return { code: 200 };
  }));

  router.delete('/favorites/lights/:id', asyncHandler(async (request, response) => {
    const id = request.params.id;
    removeFavorite(id, 'lights');
    return { code: 200 };
  }));

  router.put('/favorites/plugs/:id', asyncHandler(async (request, response) => {
    const id = request.params.id;
    putFavorite(id, 'plugs');
    return { code: 200 };
  }));

  router.delete('/favorites/plugs/:id', asyncHandler(async (request, response) => {
    const id = request.params.id;
    removeFavorite(id, 'plugs');
    return { code: 200 };
  }));
}
