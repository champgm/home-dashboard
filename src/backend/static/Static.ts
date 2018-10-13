export function routeStaticEndpoints(application): void {
  // Add the webapp folder as static content. This contains the app UI.
  const webAppFolder: string = path.join(__dirname, '../../../../dist');
  bunyanLogger.info({ webAppFolder }, 'Static content will be read.');
  application.use('/', express.static(webAppFolder));

  const indexFile: string = path.join(__dirname, '../../../../dist/index.html');
  bunyanLogger.info({ indexFile }, 'Fallback content will be read.');
  application.use('/*', express.static(webAppFolder));
}
