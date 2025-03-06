import { Response, Request } from 'elysium/server'

export function POST(req: Request) {
    return Response.json({ message: 'Hello World!' })
}