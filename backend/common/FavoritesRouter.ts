import core, { Router } from 'express';
import { HueApi, ILightsApiResponse, ILight } from 'node-hue-api';
import { environment } from '../../.env';
import bunyan from 'bunyan';
import { asyncHandler, notEmptyOrBlank } from '../common/Util';
import fs from 'fs';
import { getLights } from '../hue/HueRouter';
import { getPlugs } from '../tplink/TpLinkRouter';
import { IPlug } from '../../src/util/IPlug';

const favoritesFilePath = `${__dirname}/../Favorites.json`;
export function readFavoritesFile() {
  return JSON.parse(fs.readFileSync(favoritesFilePath, 'UTF8'));
}
export function writeFavoritesFile(favorites) {
  fs.writeFileSync(favoritesFilePath, JSON.stringify(favorites), 'UTF8');
}
export function putFavorite(id: string, type: string) {
  const favorites = readFavoritesFile();
  if (favorites[type].indexOf(id) > -1) {
    favorites[type].splice(favorites[type].indexOf(id), 1);
  }
  writeFavoritesFile(favorites);
}
export function removeFavorite(id: string, type: string) {
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
  // router.get('/favorites', asyncHandler(async (request, response) => {
  //   const lightsPromise = getLights();
  //   const favorites = readFavoritesFile();

  //   const plugs = getPlugs();
  //   const favoritePlugs: { [id: string]: IPlug } = {};
  //   Object.keys(plugs).forEach((id) => {
  //     if (favorites.plugs.indexOf(id) > -1) {
  //       favoritePlugs[id] = plugs[id];
  //     }
  //   });

  //   const favoriteLights: { [id: string]: ILight } = {};
  //   const lights = await lightsPromise;
  //   Object.keys(lights).forEach((id) => {
  //     if (favorites.lights.indexOf(id) > -1) {
  //       favoriteLights[id] = lights[id];
  //     }
  //   });

  //   return { code: 200, payload: { lights: favoriteLights, plugs: favoritePlugs } };
  // }));

  router.put('/favorites/lights/:id', asyncHandler(async (request, response) => {
    const id = request.params.id;
    putFavorite(id, 'lights');
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
