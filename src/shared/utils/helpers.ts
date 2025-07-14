export const constructResponse = (
    success: boolean,
    data: any,
    statusCode = 200,
  ) => {
    return {
      success,
      data,
      statusCode,
    };
  };