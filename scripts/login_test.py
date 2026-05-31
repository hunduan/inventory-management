import asyncio
from playwright.async_api import async_playwright

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        page.on('console', lambda msg: print('[CONSOLE]', msg.text))
        page.on('request', lambda req: print('[REQ]', req.method, req.url))
        page.on('response', lambda res: print('[RES]', res.status, res.url))
        try:
            await page.goto('http://localhost:10086/#/pages/web/login/index', wait_until='networkidle', timeout=15000)
            print('[PAGE LOADED]')
            inputs = await page.query_selector_all('input')
            print('[INPUTS FOUND]:', len(inputs))
            await page.fill('input[type=text]', 'admin@demo.com')
            await page.fill('input[type=password]', 'admin123')
            print('[FORM FILLED]')
            await asyncio.sleep(1)
            login_btn = page.locator('text=登录')
            count = await login_btn.count()
            print('[LOGIN BTN COUNT]:', count)
            if count > 0:
                print('[CLICKING LOGIN]...')
                await login_btn.first.click()
                print('[CLICKED, WAITING FOR RESPONSE]')
                await asyncio.sleep(6)
            else:
                print('[NO LOGIN BTN FOUND]')
        except Exception as e:
            print('[EXCEPTION]', e)
        finally:
            await browser.close()

asyncio.run(test())
