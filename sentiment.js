import language from '@google-cloud/language'
import credentials from './google-cloud-credentials.json'

const client = new language.LanguageServiceClient({ credentials });

export function analyze(text) {
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  return client
  .analyzeSentiment({document: document})
  .then(results => {
    const sentiment = results[0].documentSentiment;
    return results
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
}
