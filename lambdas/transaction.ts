import {APIGatewayProxyEvent, APIGatewayProxyResult, Context, Handler} from 'aws-lambda';

const handler: Handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log('Lambda transaction');
  console.log(event.body);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Add transaction!!!!!' })
  };
};

exports.handler = handler;