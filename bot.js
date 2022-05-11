
import puppeteer from 'puppeteer';
import fs from 'fs';
import yaml from 'js-yaml';

const start = async () => {
  browser = await puppeteer.launch({headless: false, defaultViewport: null});
  page = await browser.newPage();
  await page.goto('https://discord.com/login');
};

const stop = async () => {
  await browser.close();
};

const login = async (user, password) => {
  await page.focus('input[name="email"]');
  await page.keyboard.type(user);

  await page.focus('input[name="password"]');
  await page.keyboard.type(password);

  await page.click('button[type="submit"]');

  await page.waitForSelector('div[class^=container] div[class^=guild]', {visible: true});
  await page.waitForSelector('div[class^=container] div[class^=base]', {visible: true});
};

const readLogs = async () => fs.readFileSync('./logs.txt','utf8').split('\n');

const readConfigs = async () => yaml.load(fs.readFileSync('./config.yaml', 'utf8')).config;

const getOwnId = async () => await page.$eval(
  'section[class^=panel] div[class^=avatar] img',
  el => el.getAttribute('src').split('/')[4]);

const enterServer = async (server) => {
  await page.waitFor(1000);
  await page.click('div[data-dnd-name="'+server+'"] div[href]');
  await page.waitFor(1000);
  await page.waitForSelector('div[class^=members] > div > div:not(div[class^=member-3]):not(:first-of-type)');
};

const scrollMembers = async () => {
  await page.evaluate(() => {
    const lastMember = document.querySelector('div[class^=member-3]:last-of-type');
    lastMember.scrollIntoView();
  });
  await page.waitForSelector('div[class^=member-3]:last-of-type', {visible:true});
}

const findMembers = async () => await page.$$eval(`
    div[class^=member-3] div[class^=avatar] img,
    h2[class^=membersGroup] span[class^=hiddenVisually]
    `,
    els => {
      var groups = {};
      for(el in els){
        if(els[el].getAttribute('class').includes('membersGroup')){
          let groupName = els[el].textContent;
//          let groupName = els[el].getAttribute('aria-label').split(',')[0];
          currentGroupName = groupName;
        }
        else {
          if(!(currentGroupName in groups))
            groups[currentGroupName] = [];
          let userId = els[el].getAttribute("src").split('/')[4];
          if(userId)
            groups[currentGroupName].push(userId);
        }
      }
      return groups;
    }
  );

const hasMoreMembers = async () =>  page.evaluate(() =>
  !(document.querySelector('div[class^=member-3]:last-of-type')
    .getBoundingClientRect().top < window.innerHeight));

const messageUser = async (id, message) => {
  const searchButtonSelector = 'button[class^=searchBarComponent]';
  const isOnMessagesPage = await page.$(searchButtonSelector);
  if (!isOnMessagesPage){
    await page.click('div[class^=tutorialContainer] div[href="/channels/@me"]');
    await page.waitForSelector(searchButtonSelector);
  }
  await page.click(searchButtonSelector);
  const optionSelector = 'div[role=option][id^=quick-switcher]';
  const fieldSelector = 'input[aria-label="Quick switcher"]';
  await page.waitForSelector(fieldSelector);
  await page.focus(fieldSelector);
  await page.keyboard.type(id);
  try {
    await page.waitForSelector(optionSelector, {timeout: 5000});
  } catch (e) {
    await page.click(searchButtonSelector);
    return false;
  }
  const userName = await page.$eval(optionSelector, el => el.getAttribute('aria-label').split(',')[2].trimStart());
  await page.click(optionSelector);
  const textBoxSelector = 'div[class^=channelTextArea] div[role=textbox]';
  await page.waitForSelector(textBoxSelector);
  await page.focus(textBoxSelector);
  await sleep(3000);
  await page.keyboard.type(message);
  await page.keyboard.press('Enter');
  await page.waitForSelector('li[id^=chat-messages]');
  return true;
}

var browser;
var page;
var currentGroupName;
var usersToMessage = [];

const log = await readLogs();
const {user, password, message, servers} = await readConfigs();

await start();
await login(user, password);
const botId = await getOwnId();

for (const server in servers){
  const serverName = servers[server].name;
  const serverGroups = servers[server].groups;
  await enterServer(serverName);
  while (true){
    await sleep(1000);
    let foundMembers = await findMembers();
    console.log(foundMembers)
    for(const group in foundMembers){
      const isGroupSelected = serverGroups.includes(group);
      if(isGroupSelected){
        const groupMembers = foundMembers[group];
        let newUsers = groupMembers.filter(user => {
          const userNotInLogs = !(log.includes(user));
          const userNotInList = !(usersToMessage.includes(user));
          return userNotInLogs && userNotInList;
        });
        usersToMessage = usersToMessage.concat(newUsers);
      }
    }
    const isMembersEnd = !(await hasMoreMembers());
    if (isMembersEnd)
      break;
    else
      await scrollMembers();
  }
  usersToMessage = usersToMessage.filter(user => user!=botId);
  for(const userToMessage in usersToMessage){
    const success = await messageUser(usersToMessage[userToMessage], message);
    if(success){
      fs.appendFileSync('./logs.txt', usersToMessage[userToMessage]+'\n');
    }
  }
}

await stop();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

