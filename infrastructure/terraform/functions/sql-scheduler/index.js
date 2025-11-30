const { sqladmin } = require('@googleapis/sqladmin');
const functions = require('@google-cloud/functions-framework');
const { GoogleAuth } = require('google-auth-library');

async function updateInstanceActivationPolicy(policy) {
  const projectId = process.env.PROJECT_ID;
  const instanceName = process.env.INSTANCE_NAME;

  console.log(`Setting activation policy to ${policy} for ${instanceName}`);

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const authClient = await auth.getClient();

  const sql = sqladmin({ version: 'v1', auth: authClient });

  const response = await sql.instances.patch({
    project: projectId,
    instance: instanceName,
    requestBody: {
      settings: {
        activationPolicy: policy,
      },
    },
  });

  console.log(`Operation started: ${response.data.name}`);
  return response.data;
}

functions.http('startSql', async (req, res) => {
  try {
    await updateInstanceActivationPolicy('ALWAYS');
    res.status(200).send('SQL instance starting');
  } catch (error) {
    console.error('Error starting SQL instance:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

functions.http('stopSql', async (req, res) => {
  try {
    await updateInstanceActivationPolicy('NEVER');
    res.status(200).send('SQL instance stopping');
  } catch (error) {
    console.error('Error stopping SQL instance:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
});
