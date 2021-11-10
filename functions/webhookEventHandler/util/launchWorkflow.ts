import axios, { AxiosInstance } from "axios";
import { SecretsManager } from "aws-sdk";
import asana from "asana";

export = async (taskId: string, asanaClient: AxiosInstance): Promise<any> => {
  const secrets = new SecretsManager({
    region: "us-east-1",
    apiVersion: "2017-10-17",
  });

  const secretReference = process.env.API_SECRETS;

  if (!secretReference) return;

  const { SecretString } = await secrets
    .getSecretValue({ SecretId: secretReference })
    .promise();

  if (!SecretString) return;

  const { ironcladApiKey } = JSON.parse(SecretString);

  if (!ironcladApiKey) return;

  const taskResponse = await asanaClient.get(`/tasks/${taskId}`);

  let customFieldData = taskResponse?.data?.data?.custom_fields;

  let Product: string | undefined,
    PriceA: number | undefined,
    PriceB: number | undefined,
    PriceC: number | undefined,
    CounterpartySignerEmail: string | undefined,
    CounterpartySignerName: string | undefined;

  // The ID of the workflow template to be launched.
  const workflowTemplateId = "61844f27b17de31ee700a3da";
  const submitterEmail = "bengraneygreen@asana.com";

  console.log(taskResponse);
  for (let i = 0; i < customFieldData.length; i++) {
    console.log(customFieldData[i]);
    if (customFieldData[i].display_value) {
      switch (customFieldData[i].name) {
        case "Vendor Name":
          CounterpartySignerName = customFieldData[i].text_value;
          break;

        case "Vendor Email":
          CounterpartySignerEmail = customFieldData[i].text_value;
          break;

        case "Price A":
          PriceA = customFieldData[i].number_value;
          break;

        case "Price B":
          PriceB = customFieldData[i].number_value;
          break;

        case "Price C":
          PriceC = customFieldData[i].number_value;
          break;

        case "Product":
          Product = customFieldData[i].display_value;
          break;
      }
      console.log(
        CounterpartySignerName,
        CounterpartySignerEmail,
        PriceA,
        PriceB,
        PriceC,
        Product
      );
    }
  }

  // Your host URL may vary based on the implementation.
  const hostUrl = "demo.ironcladapp";
  const apiUrl = `https://${hostUrl}.com/public/api/v1`;

  // The Ironclad Request body needed to launch the workflow.
  const ironcladRequestBody: any = {
    template: workflowTemplateId,
    creator: {
      type: "email",
      email: submitterEmail,
    },
    attributes: {
      counterpartyName: CounterpartySignerName,
      roleaec3ac804b6649e281e9e129e1ffe893: CounterpartySignerEmail,
      role356eb6cecb0840f1bfa9d326150f47cd: CounterpartySignerName,
      customee310ac410734cf583497b0eba55fff0: Product,
    },
  };

  switch (Product) {
    case "A":
      console.log("product A");
      ironcladRequestBody.attributes["custom44fd16caa9894e67b700d7b22fbd4a48"] =
        {
          currency: "USD",
          amount: PriceA,
        };
      break;
    case "B":
      console.log("product B");

      ironcladRequestBody.attributes["customcd5d30369f00417db25d91d71db15a9a"] =
        {
          currency: "USD",
          amount: PriceB,
        };
      break;
    case "C":
      console.log("product C");
      ironcladRequestBody.attributes["customeeabc24fd108463186620a4bdc901d6f"] =
        {
          currency: "USD",
          amount: PriceC,
        };
      break;
  }

  console.log(ironcladRequestBody);

  const workflowUrl = `${apiUrl}/workflows`;
  let result = await axios.post(
    workflowUrl,
    JSON.stringify(ironcladRequestBody),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ironcladApiKey}`,
      },
    }
  );
  console.log(result);

  const commentBody = {
    data: {
      text: `ironclad workflow has been kicked off. find it at https://demo.ironcladapp.com/workflow/${result.data.id}`,
    },
  };

  const customFieldBody = {
    data: {
      custom_fields: {
        "1201341418539947": `https://demo.ironcladapp.com/workflow/${result.data.id}`,
      },
    },
  };

  let fullPromise = Promise.all([
    asanaClient.post(`/tasks/${taskId}/stories`, commentBody),
    asanaClient.put(`/tasks/${taskId}`, customFieldBody),
  ]);

  return await fullPromise;
};
