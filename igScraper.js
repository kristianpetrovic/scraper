const puppeteer = require('puppeteer');

const igScraper = async () => {

  // Set data for login
  process.env.IGUSERNAME
  const un = process.env.IGUSERNAME
  const pw = process.env.IGPASSWORD

  const browser = await puppeteer.launch({ 
    headless: true //Use false if you don't want to see what's heppening
  });
  const page = await browser.newPage();

  // Set initial page
  const url = process.env.IGURL

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

  // Login
  await page.type('input[name=username]', un, { delay: 200 })
  await page.type('input[name=password]', pw, { delay: 200 })
  await page.click('button[type=submit]', { delay: 200 })

  await page.waitForTimeout(5000) //wait for approx 5s to next page load appropirately


  // Sometimes there are some notification windows - popups
  //- after login check for the 'Save your login info box' - I saw it comes up usually
  const notifications = await page.$x('//button[contains(text(), "Not Now")]')

  // Check if box exist
  if(notifications.length > 0)
    await notifications[0].click()


  await page.waitForTimeout(5000); // Wait 5s to load
  
  
  await page.waitForSelector('header.vtbgv section.zwlfE .nZSzR h2._7UhW9.fKFbl.yUEEX.KV-D4.fDxYl')
  await page.waitForSelector('header.vtbgv section.zwlfE .-vDIg h1.rhpdm')
  await page.waitForSelector('header.vtbgv section.zwlfE ul.k9GMp .Y8-fY:first-child span.g47SY')

  const profileUsernameElement = await page.$('header.vtbgv section.zwlfE .nZSzR h2._7UhW9.fKFbl.yUEEX.KV-D4.fDxYl')
  const profileFullnameElement = await page.$('header.vtbgv section.zwlfE .-vDIg h1.rhpdm')
  const postsElement = await page.$('header.vtbgv section.zwlfE ul.k9GMp .Y8-fY:first-child span.g47SY')
  // const profileImgElement = await page.$('header.vtbgv > div.XjzKX > div._4dMfM > div.M-jxE button.IalUJ img.be6sR')

  //Grab profile username
  const profileData = {
    profileUsername : await profileUsernameElement.evaluate(el => el.textContent),
    profileFullname: await profileFullnameElement.evaluate(el => el.textContent),
    posts: await postsElement.evaluate(el => el.textContent),
    // profileImg: await profileImgElement.evaluate(el => el.src),
  }

  await page.waitForTimeout(500); // Wait 0.5s to load

  //Click on follower button
  const followersBtn = await page.$('header.vtbgv > section > ul > li:nth-child(2) > a')
  await followersBtn.evaluate(btn => btn.click()) //Click to open the popup

  await page.waitForTimeout(3500); // Wait 3.5s to load

  const followersPopup = 'div[role="dialog"] > div > div:nth-child(2)'
  await page.waitForSelector('div[role="dialog"] > div > div:nth-child(2) > ul'); // Make sure that the selector exist before we can proceed further

  // Scroll down the page until the end
  await scrollDown(followersPopup, page)

  //Get the list of followers
  const followersList = await page.$$('div[role="dialog"] div.isgrP ul.jSC57._6xe7A div.PZuss li a.FPmhX.notranslate._0imsa')

  let avatarPaths = [
    'div[role="dialog"] div.isgrP ul.jSC57._6xe7A div.RR-M-.SAvC5 img._6q-tv',
  ]

  const followersPics = await avatarPaths.reduce(async (accProm, path) => {
    const acc = await accProm
    const arr = await page.$$eval(path, res => {
      return res.map( pic => {
        const alt = pic.getAttribute('alt')
        const words = alt.split(/(['])/g)
        return {
          username: words[0],
          avatar: pic.getAttribute('src')
        }
      })
    })
    return acc.concat( [ ...arr ] )
  }, Promise.resolve([]) )

  //Grab the followers
  const followers = await Promise.all( followersList.map( async item => {
    const username = await (await item.getProperty('innerText')).jsonValue()
    const pic = followersPics.find( p => p.username === username) || { avatar: "" }

    return {
      avatar: await pic.avatar,
      username //Check later
    }

  }))

  //Close the actual followers popup
  const closeBtn = await page.$('div[role="dialog"] .WaOAr button.wpO6b')
  await closeBtn.evaluate( btn => btn.click() )

  await page.waitForTimeout(200); // Wait 200ms

  //Open the following popup
  const followingBtn = await page.$('header.vtbgv > section ul.k9GMp li:nth-child(3) > a')
  await followingBtn.evaluate( btn => btn.click() )

  await page.waitForTimeout(3000); // Wait 3s to load

  const followingPopup = 'div[role="dialog"] > div > div.isgrP'
  await page.waitForSelector('div[role="dialog"] > div > div.isgrP > ul'); // Make sure that the selector exist before we can proceed further

  // Scroll down the page until the end
  await scrollDown(followingPopup, page)

  //get following list
  const followingList = await page.$$('div[role="dialog"] > div > div.isgrP > ul > div > li a.FPmhX.notranslate._0imsa')
  await page.waitForSelector('div[role="dialog"] > div > div.isgrP > ul > div > li > div > div a._2dbep.qNELH.kIKUG img')

  avatarPaths = [
    'div[role="dialog"] > div > div.isgrP > ul > div > li > div > div a._2dbep.qNELH.kIKUG img',
  ]

  const followingPics = await avatarPaths.reduce(async (accProm, path) => {
    const acc = await accProm
    const arr = await page.$$eval(path, res => {
      return res.map( pic => {
        const alt = pic.getAttribute('alt')
        const words = alt.split(/(['])/g)
        return {
          username: words[0],
          avatar: pic.getAttribute('src')
        }
      })
    })
    return acc.concat( [ ...arr ] )
  }, Promise.resolve([]) )

  //Grab the following
  const following = await Promise.all( followingList.map( async item => {
    const username = await (await item.getProperty('innerText')).jsonValue()
    const pic = followingPics.find( p => p.username === username) || { avatar: "" }

    return {
      avatar: await pic.avatar,
      username //Check later
    }

  }))


  // List not following you
  const notFollowingYou = following.filter( item => {
    return !followers.find(f => f.username === item.username)
  })

  // List not following them
  const notFollowingThem = followers.filter( item => {
    return !following.find(f => f.username === item.username)
  })

  //Count followers
  const followerCount = followers.length
  const followingCount = following.length
  const notFollowingYouCount = notFollowingYou.length
  const notFollowingThemCount = notFollowingThem.length


  await browser.close(); //Close the browser

  return {
    followerCount,
    followingCount,
    notFollowingThem,
    notFollowingYou,
    followers,
    following,
    profileData,
    notFollowingYouCount,
    notFollowingThemCount
  }

}

async function scrollDown( selector, page ){
  await page.evaluate( async selector => {
    const section = document.querySelector( selector )
    await new Promise( (resolve, reject) => {
      let totalHeight = 0;
      let distance = 100;
      const timer = setInterval( () => {
        var scrollHeight = section.scrollHeight;
        section.scrollTop = 10000000000;
        totalHeight += distance;

        if(totalHeight >= scrollHeight){
          clearInterval(timer)
          resolve();
        }
      }, 300)
    })
  }, selector)
}

module.exports = {igScraper}