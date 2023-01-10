class ResourceFetcher {
    private cache: Map<string, any> = new Map();

    public async fetchText(url: string): Promise<string> {
        const cached = this.cache.get(url);
        if (cached) {
            return cached as string;
        } else {
            const response = await fetch(url);
            const result = await response.text();
            this.cache.set(url, result);
            return result;
        }
    }

    public async fetchRaw(url: string): Promise<ArrayBuffer> {
        const cached = this.cache.get(url);
        if (cached) {
            return cached as ArrayBuffer;
        } else {
            const response = await fetch(url);
            const result = await (await response.blob()).arrayBuffer();
            this.cache.set(url, result);
            return result;
        }
    }

    public async fetchImg(url: string): Promise<HTMLImageElement> {
        const cached = this.cache.get(url);
        if (cached) {
            return cached as HTMLImageElement;
        } else {
            const result = await new Promise<HTMLImageElement>((res, rej) => {
                const img = document.createElement("img");
                img.src = url;
                img.addEventListener("load", function () {
                    res(img);
                });
                img.addEventListener("error", function (err) {
                    rej(err);
                });
            });
            this.cache.set(url, result);
            return result;
        }
    }
}

export const resourceFetcher = new ResourceFetcher();
