import {APIGatewayProxyEvent, APIGatewayProxyResult, Context, Handler} from 'aws-lambda';

const update: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log(event.body);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Update balance!!!' })
  };
};

export const find: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log(event.body);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Get balance!!!' })
  };
};

exports.update = update;
exports.find = find;