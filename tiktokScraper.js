const puppeteer = require('puppeteer');

const tiktokScraper = async () => {

  // URL to scrape
  const url = process.env.TKURL

  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true //Use false if you don't want to see what's heppening
  });
  const page = await browser.newPage();

  // Open the url
  await page.goto(url, {
    waitUntil: "networkidle2"
  });

  // Set the viewport dimensions
  await page.setViewport({
    width: 1440,
    height: 800,
    deviceScaleFactor: 1,
  });
  
  await page.waitForTimeout(5000); // Wait 5s to load

  
  await page.waitForSelector('h2.jsx-2997938848.share-title')
  await page.waitForSelector('.share-header .count-infos')

  const profileUsernameElement = await page.$('h2.jsx-2997938848.share-title')
  const profileFullnameElement = await page.$('h1.share-sub-title')
  const followingElement = await page.$('.share-header .count-infos .number:nth-child(1) strong')
  const followersElement = await page.$('.share-header .count-infos .number:nth-child(2) strong')
  const likesElement = await page.$('.share-header .count-infos .number:nth-child(3) strong')
  const profileImgElement = await page.$('.share-header span.tiktok-avatar.tiktok-avatar-circle.avatar.jsx-3659161049 img')
  const shareDescriptionElement = await page.$('.share-header .share-desc.mt10')


  //Grab profile username
  const profileData = {
    profileUsername : await profileUsernameElement.evaluate(el => el.textContent),
    profileFullname: await profileFullnameElement.evaluate(el => el.textContent),
    following: await followingElement.evaluate(el => el.textContent),
    profileImg: await profileImgElement.evaluate(el => el.src),
    followers: await followersElement.evaluate(el => el.textContent),
    likes: await likesElement.evaluate(el => el.textContent),
    desc: await shareDescriptionElement.evaluate(el => el.textContent),
  }

  await page.waitForTimeout(1000); // Wait 1s to load
  
  // Scroll down the page until the end
  await autoScroll(page)

  await page.waitForTimeout(1000); // Wait 1s to load


  const videos = await page.evaluate(() => {
    const textsToReturn = [];
  
    const elems = Array.from(document.querySelectorAll('.image-card'));
    const playCounts = Array.from(document.querySelectorAll('strong.video-count'))

    elems.forEach( (el, i) => {
      textsToReturn.push({
        bgUrl: el.style.backgroundImage.slice(4, -1).replace(/"/g, ""),
        videoCount: playCounts[i].textContent
    })
    })
 
    return textsToReturn
  })

  await browser.close(); //Close the browser

  return {
    videos,
    profileData
  }

}

async function autoScroll(page){
  await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
          var totalHeight = 0;
          var distance = 100;
          var timer = setInterval(() => {
              var scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight){
                  clearInterval(timer);
                  resolve();
              }
          }, 100);
      });
  });
}

module.exports = {tiktokScraper}