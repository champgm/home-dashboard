// This is a wrapper for all route handlers
// We need to take special care to handle asynchronous errors. Lambda has a tendency to eat them
export function asyncHandler(
  handler: (request: any, response: any) => Promise<any>
): (request: any, response: any, next: () => {}) => void {
  return (request: any, response: any, next: (error: any) => {}): void => {
    // Call the handler
    handler(request, response)
      // Log and return the response
      .then(responseObject => {
        response.status(responseObject.code).json(responseObject);
      })
      .catch(error => {
        // Pass it on to the global handler
        next(error);
      })
      .then(() => {});
  };
}
