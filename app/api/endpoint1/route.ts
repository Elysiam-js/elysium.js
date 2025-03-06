import { Response, Request } from 'elysium/server'

export function GET(req: Request) {
    return Response.json({ message: 'Hello World!' })
}