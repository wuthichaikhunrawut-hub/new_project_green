const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI('AIzaSyCwYMWXmc1wgqIAfpTttQR47ZIeVPcwh6Q');

async function testModel(modelName) {
  try {
    await genAI.getGenerativeModel({ model: modelName }).generateContent("hello");
    console.log("Success with", modelName);
  } catch (e) {
    console.error("Error with", modelName, ":", e.message.substring(0, 50));
  }
}

async function run() {
  await testModel('gemini-1.5-flash-latest');
  await testModel('gemini-pro');
  await testModel('gemini-1.0-pro');
  await testModel('gemini-1.5-pro');
}

run();
