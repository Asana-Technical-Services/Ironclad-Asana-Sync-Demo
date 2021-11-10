"hi";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import createAsanaClient from "./util/createAsanaClient";
import launchWorkflow from "./util/launchWorkflow";

exports.lambdaHandler = async (input: {
  event: APIGatewayProxyEvent;
  action: string;
}) => {
  console.log(input);
  if (!input?.event?.body) return;

  const body = JSON.parse(input.event.body);

  let allPromises = [];

  // create an auth'd API client for Asana using Axios.
  const asanaClient = await createAsanaClient();

  if (!asanaClient) {
    console.log("failed");
    return;
  }

  // handle events:

  if (!body?.events) return;

  for (let asanaEvent of body?.events) {
    // do something async to handle the events!
    if (asanaEvent.parent?.resource_type === "project") {
      allPromises.push(launchWorkflow(asanaEvent.resource.gid, asanaClient));
    }
  }

  // wait for all your async handlers to finish
  console.log(await Promise.all(allPromises));

  return;
};
