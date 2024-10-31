import {
    ACTIONS_CORS_HEADERS,
    ActionGetResponse,
    ActionPostRequest,
    ActionPostResponse,
    createPostResponse,
} from "@solana/actions";

import {
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const payload: ActionGetResponse = {
        icon: `${url.origin}/eclipse.png`,
        title: "Donate to Eclipse",
        description: "Support Eclipse by transferring Ethereum",
        label: "Transfer 0.1 Ethereum",
        links: {
            actions: [
                {
                    type: "transaction",
                    label: "Transfer 0.1 Ethereum",
                    href: `${url.href}?amount=0.1`,
                },
            ],
        },
    };
    return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
    });
}

export const OPTIONS = GET;

export async function POST(request: Request) {
    const body: ActionPostRequest = await request.json();

    const url = new URL(request.url);

    const amount = Number(url.searchParams.get("amount")) || 0.1;

    let sender;

    try {
        sender = new PublicKey(body.account);
    } catch {
        return Response.json(
            {
                error: {
                    message: "Invalid account",
                },
            },
            {
                status: 400,
                headers: ACTIONS_CORS_HEADERS,
            }
        );
    }

    const connection = new Connection("https://staging-rpc.dev2.eclipsenetwork.xyz", "confirmed");

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: new PublicKey("9qab12QiYNhmdzKvdcjXm17AVrDF42LPuF52nHfWpjxS"),
            lamports: amount * LAMPORTS_PER_SOL,
        })
    );
    transaction.feePayer = sender;
    transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
    ).blockhash;
    transaction.lastValidBlockHeight = (
        await connection.getLatestBlockhash()
    ).lastValidBlockHeight;

    const payload: ActionPostResponse = await createPostResponse({
        fields: {
            type: "transaction",
            transaction: transaction,
            message: "Transaction created",
        },
    });
    return new Response(JSON.stringify(payload), {
        headers: ACTIONS_CORS_HEADERS,
    });
}