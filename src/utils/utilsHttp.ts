export async function post(endpoint: string, auth: string, payload: unknown): Promise<unknown> {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    if (auth) {
        headers.set("Authorization", `Bearer ${auth}`);
    }

    const requestOptions = {
        headers,
        method: "POST",
        body: JSON.stringify(payload)
    };

    const response = await fetch(`${endpoint}`, requestOptions);
    const json = await response.json();

    if (response.status !== 200 && response.status !== 201) {
        console.error("Error payload: ", json);
        throw new Error(`Bad status: ${response.status}`);
    }

    return json;
}
