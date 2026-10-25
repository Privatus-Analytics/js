// Conformance example app for @privatus-analytics/nestjs (Express platform, EJS views).
//
// Built by the conformance suite (https://github.com/Privatus-Analytics/conformance).
// See its CONTRACT.md for what each route must render. The site id and script
// host come from PRIVATUS_SITE_ID and PRIVATUS_SCRIPT_HOST.
import 'reflect-metadata'
import { join } from 'node:path'
import { Controller, Get, Header, Module, Render, type MiddlewareConsumer, type NestModule } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { PrivatusMiddleware, PrivatusModule, PrivatusService } from '@privatus-analytics/nestjs'
import type { NextFunction, Request, Response } from 'express'

const PAGE_PROPS = { plan: 'pro', role: 'admin', beta: true, seats: 3 }
const NASTY = '</script><script>window.__pwned=1</script>  &<>"\''
const NONCE = 'testnonce'
const SCRIPT_HOST = (process.env.PRIVATUS_SCRIPT_HOST || 'https://privatusstats.com').replace(/\/+$/, '')

const AUTO_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Auto inject</title>
</head>
<body><h1>Auto inject</h1><p>No tag in the template. The middleware adds it.</p></body>
</html>
`

@Controller()
class PagesController {
  @Get()
  @Render('home')
  home(): Record<string, never> {
    return {}
  }

  @Get('event')
  @Render('event')
  event(): Record<string, never> {
    return {}
  }

  @Get('nasty')
  @Render('nasty')
  nasty(): { nasty: string } {
    return { nasty: NASTY }
  }

  // Off with the queue stub on: only the stub prints, so privatus.track still works.
  @Get('off')
  @Render('off')
  off(): { title: string; queueStub: boolean } {
    return { title: 'Off', queueStub: true }
  }

  // Off with the queue stub off: nothing prints.
  @Get('off-plain')
  @Render('off')
  offPlain(): { title: string; queueStub: boolean } {
    return { title: 'Off plain', queueStub: false }
  }

  @Get('auto')
  @Header('Content-Type', 'text/html; charset=utf-8')
  auto(): string {
    return AUTO_PAGE
  }
}

// Forced on, so the tag prints whatever the environment.
@Module({
  imports: [PrivatusModule.forRoot({ enabled: true, queueStub: true, props: PAGE_PROPS })],
  controllers: [PagesController],
})
class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(PrivatusMiddleware).forRoutes('{*splat}')
  }
}

async function main(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn'] })
  // What helmet's docs suggest: a nonce in res.locals.cspNonce and a matching policy.
  // The package finds the nonce there.
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.locals.cspNonce = NONCE
    res.setHeader('Content-Security-Policy', `script-src 'nonce-${NONCE}' ${SCRIPT_HOST}`)
    next()
  })
  // Auto inject for /auto only, so the other routes test the template helper alone.
  app.use('/auto', new PrivatusService({ enabled: true, autoInject: true }).middleware())
  app.setBaseViewsDir(join(__dirname, '..', 'views'))
  app.setViewEngine('ejs')
  const port = Number(process.env.PORT || 8080)
  await app.listen(port, '0.0.0.0')
  console.log(`Listening on http://0.0.0.0:${port}`)
}

void main()
