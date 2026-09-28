interface Env {
  APP_URL: string;
  CRON_SECRET: string;
}

interface Trigger {
  method: "GET" | "POST";
  path: string;
  description: string;
}

const TRIGGERS: Record<string, Trigger> = {
  "*/15 * * * *": {
    method: "POST",
    path: "/api/questions/close",
    description: "Close every open question whose close time has passed",
  },
  "0 21 * * *": {
    method: "POST",
    path: "/api/cron/settle",
    description: "Settle closed questions whose resolution time arrived",
  },
  "30 6 * * *": {
    method: "GET",
    path: "/api/cron/house-models",
    description: "Check the OpenRouter free-model catalog",
  },
  "45 21 * * *": {
    method: "POST",
    path: "/api/cron/anchor",
    description: "Plant the chain head on Robinhood Chain",
  },
};

function resolveUrl(appUrl: string, path: string): string {
  return `${appUrl.replace(/\/+$/, "")}${path}`;
}

async function fire(env: Env, controller: ScheduledController): Promise<void> {
  const trigger = TRIGGERS[controller.cron];

  if (trigger === undefined) {
    console.warn(`called-cron: no route mapped for schedule "${controller.cron}"`);
    return;
  }

  const url = resolveUrl(env.APP_URL, trigger.path);

  const response = await fetch(url, {
    method: trigger.method,
    headers: {
      authorization: `Bearer ${env.CRON_SECRET}`,
      "user-agent": "called-cron/1.0",
    },
  });

  const body = await response.text();

  if (!response.ok) {
    console.error(
      `called-cron: ${trigger.method} ${url} -> ${response.status} ${body.slice(0, 500)}`,
    );
    return;
  }

  console.log(`called-cron: ${trigger.method} ${url} -> ${response.status}`);
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    await fire(env, controller);
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        cron: {
          "*/15 * * * *": "/api/questions/close",
          "0 21 * * *": "/api/cron/settle",
          "30 6 * * *": "/api/cron/house-models",
          "45 21 * * *": "/api/cron/anchor",
        },
      });
    }

    return new Response("Called cron worker. Scheduled triggers only.", {
      status: 404,
    });
  },
};
