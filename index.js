import Twit from 'twit'
import twitterBot from 'node-twitterbot'
import { analyze } from './sentiment'
import twitterCredentials from './twitter-credentials.json'
import fs from 'fs'

const ohh = fs.readFileSync('./ohh.gif', { encoding: 'base64' })

let T = new Twit(twitterCredentials)
let stream = T.stream('statuses/filter', { track: ['fuck'] })
let reactions = []

console.log('Loading images...')

const reactionsNames = fs.readdirSync('./reactions');

const imageList = reactionsNames.reduce((reducer, name) => {
  reducer[name] = fs.readFileSync(`./reactions/${name}`, { encoding: 'base64' })
  return reducer
}, {})

uploadImages()

async function uploadImages() {
  try {
    reactions = await Promise.all(
      Object.values(imageList).map((image) => uploadMedia(image))
    )

    console.log('🤘')
    start()
  } catch(error) {
    console.error(error)
  }
}

function uploadMedia(image) {
  return new Promise((resolve, reject) => {
    T.post('media/upload', { media_data: image }, function (err, data, response) {
      if(err) {
        reject(err)
      }

      const mediaIdStr = data.media_id_string
      const altText = '😁'
      const metaParams = { media_id: mediaIdStr, alt_text: { text: altText } }

      resolve({
        mediaIdStr,
        altText,
        metaParams
      })
    })
  })
}

function start() {
  stream.on('tweet', async function (tweet) {
    if (!tweet.retweeted_status && tweet.in_reply_to_screen_name && (tweet.user.screen_name !== tweet.in_reply_to_screen_name)) {
      const analysis = await analyze(tweet.text)
      const isNegativeTweet = analysis.some((tweetAnalysis) => {
      const { magnitude, score } = tweetAnalysis.documentSentiment

        return isNegativeSentence(magnitude, score)
      });

      if(isNegativeTweet) {
        console.log('😁')
        sendResponse(tweet.id_str, tweet.user.screen_name, tweet.in_reply_to_screen_name)
      }
    }
  })
}

function isNegativeSentence(magnitude, score) {
  return magnitude > 1 && score < 0
}

function sendResponse(in_reply_to_status_id, screenName, inRepplyScreenName) {
  if(in_reply_to_status_id) {
    const { mediaIdStr, metaParams } = reactions[Math.floor(Math.random() * reactions.length)];
    T.post('media/metadata/create', metaParams, function (err, data, response) {
      if (!err) {
        let replyMentions = inRepplyScreenName ? `@${inRepplyScreenName} @${screenName}` : `@${screenName}`

        const params = {
          in_reply_to_status_id,
          status: `${replyMentions} 😁`,
          media_ids: [mediaIdStr]
        }

        console.log(params)

        T.post('statuses/update', params, function (err, data, response) {
          if(!err) {
            console.log('🔥')
          } else {
            console.log('🚨', err)
          }
        })
      }
    })
  }
}
