const axios = require('axios');
const cheerio = require('cheerio');
const sgMail = require('@sendgrid/mail');
const pushover = require('pushover-notifications');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const SENDGRID_TO_EMAIL = process.env.SENDGRID_TO_EMAIL;
const PUSHOVER_USER_KEY = process.env.PUSHOVER_USER_KEY;
const PUSHOVER_API_TOKEN = process.env.PUSHOVER_API_TOKEN;

const socialMediaAccounts = [
  // { platform: 'Twitter', url: 'https://x.com/TheRoaringKitty' },
  { platform: 'Twitter', url: 'https://x.com/elonmusk' },
  // { platform: 'YouTube', url: 'https://www.youtube.com/channel/UCBVriGGZnssyxL0a2ypTsNg' },
  { platform: 'YouTube', url: 'https://www.youtube.com/@espn/videos' },
  // { platform: 'Reddit', url: 'https://www.reddit.com/user/DeepFuckingValue/' },
  //{ platform: 'Reddit', url: 'https://www.reddit.com/user/AutoModerator/' },
  //
];

let lastCheckedPosts = {};


module.exports = async function (context, myTimer) {
  for (const account of socialMediaAccounts) {
    try {
      console.log(`Checking ${account.platform} at ${account.url}...`);
      const response = await axios.get(account.url);
      const $ = cheerio.load(response.data);

      let latestPost;
      if (account.platform === 'Twitter') {
        const tweets = $('div[data-testid="tweet"]');
        console.log(`Found ${tweets.length} tweets on ${account.platform}`);

        if (tweets.length > 0) {
          latestPost = tweets.first().text().trim();
          console.log(`Latest tweet content: "${latestPost}"`);
        } else {
          console.log(`No tweets found on ${account.platform}`);
        }
      } else if (account.platform === 'YouTube') {
        const videos = $('a#video-title');
        console.log(`Found ${videos.length} videos on ${account.platform}`);

        if (videos.length > 0) {
          latestPost = videos.first().text().trim();
          console.log(`Latest video title: "${latestPost}"`);
        } else {
          console.log(`No videos found on ${account.platform}`);
        }
      } else if (account.platform === 'Reddit') {
        const posts = $('h3._eYtD2XCVieq6emjKBH3m');
        console.log(`Found ${posts.length} posts on ${account.platform}`);

        if (posts.length > 0) {
          latestPost = posts.first().text().trim();
          console.log(`Latest post title: "${latestPost}"`);
        } else {
          console.log(`No posts found on ${account.platform}`);
        }
      }

      if (latestPost && lastCheckedPosts[account.platform] !== latestPost) {
        console.log(`New post found on ${account.platform}!`);
        lastCheckedPosts[account.platform] = latestPost;

        const subject = `New Roaring Kitty Post on ${account.platform}`;
        const text = `New post by Roaring Kitty on ${account.platform}: ${latestPost}`;
        const html = `<p>New post by Roaring Kitty on ${account.platform}: ${latestPost}</p>`;

        await sendEmailAlert(subject, text, html);
        await sendPushoverAlert(subject, account.url, text);
      } else {
        console.log(`No new posts found on ${account.platform}.`);
      }
    } catch (error) {
      console.error(`Error checking ${account.platform}:`, error);
    }
  }
};

async function sendEmailAlert(subject, text, html) {
  const message = {
    to: SENDGRID_TO_EMAIL,
    from: SENDGRID_FROM_EMAIL,
    subject,
    text,
    html,
  };

  sgMail.setApiKey(SENDGRID_API_KEY);
  await sgMail.send(message);
  console.log('Email alert sent.');
}

async function sendPushoverAlert(title, link, body) {
  const message = {
    title: `RoaringKitty Alert: ${title}`,
    message: body,
    url: link,
  };

  pushover.send({
    user: PUSHOVER_USER_KEY,
    token: PUSHOVER_API_TOKEN,
    ...message,
  }, (err, result) => {
    if (err) {
      console.error(`Error sending Pushover alert: ${err}`);
    } else {
      console.log('Pushover alert sent.');
    }
  });
}