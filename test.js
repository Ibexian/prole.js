//Remember to save the npm install of ava
import test from 'ava';
import webdriver from 'selenium-webdriver';
const prole = require('./prole-test');

test.beforeEach(async t => {
  t.context.driver = await prole.driver({
      options:{
        strict: true
      },
      cacheFile:'segmentTest'
    });
});

test('Search for avajs', async t => {
      let driver = t.context.driver;
      await searchGoogle(driver, 'avajs')
      t.is(await driver.getTitle(), "avajs - Google Search");
      await driver.quit();
});

test('Search for avajs', async t => {
      let driver = t.context.driver;
      await searchGoogle(driver, 'avajs')
      t.is(await driver.getTitle(), "avajs - Google Search");
      await driver.quit();
});

test('Search for concurrent', async t => {
      let driver = t.context.driver;
      await searchGoogle(driver, 'concurrent')
      t.is(await driver.getTitle(), "concurrent - Google Search");
      await driver.quit();
});

async function searchGoogle(driver, keyword) {
      await driver.get('http://www.google.com/ncr');
      await driver.findElement(webdriver.By.name('q')).sendKeys(keyword);
      await driver.findElement(webdriver.By.name('btnG')).click();
      await driver.wait(webdriver.until.titleIs(keyword + ' - Google Search'), 1000);
}
