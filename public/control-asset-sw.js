async function e(e, n) {
	let r = new t(e.url, e.status, e.headers.get("X-Request-Id") ?? n?.requestId);
	r.message = `Api error with status ${r.statusCode}${n?.message ? `. ${n.message}` : ""}`;
	let i = [`URL: ${r.url}`, r.requestId ? `Request ID: ${r.requestId}` : void 0].filter(Boolean).join(". ");
	if (e.headers.get("Content-Type")?.startsWith("application/json")) {
		let t = await e.json();
		r.message = t.error || t.message || r.message, t.error_description && (r.message = r.message ? r.message + `: ${t.error_description}` : t.error_description), r.data = t;
	} else r.data = { message: await e.text() };
	throw r.message += `. ${i}`, r;
}
var t = class extends Error {
	statusCode;
	url;
	requestId;
	data;
	constructor(e, t, n, r) {
		super(r), this.statusCode = t, this.requestId = n, this.url = e;
	}
}, n = class extends Error { };
function r(e) {
	if (!e.startsWith("hf_")) throw TypeError("Your access token must start with 'hf_'");
}
function i(e) {
	if (e.accessToken) return r(e.accessToken), e.accessToken;
	if (e.credentials?.accessToken) return r(e.credentials.accessToken), e.credentials.accessToken;
}
function a(e) {
	if (typeof e != "string") return e;
	if (e.startsWith("model/") || e.startsWith("models/")) throw TypeError("A repo designation for a model should not start with 'models/', directly specify the model namespace / name");
	if (e.startsWith("space/")) throw TypeError("Spaces should start with 'spaces/', plural, not 'space/'");
	if (e.startsWith("dataset/")) throw TypeError("Datasets should start with 'datasets/', plural, not 'dataset/'");
	if (e.startsWith("bucket/")) throw TypeError("Buckets should start with 'buckets/', plural, not 'bucket/'");
	let t = e.split("/").length - 1;
	if (e.startsWith("spaces/")) {
		if (t !== 2) throw TypeError("Space Id must include namespace and name of the space");
		return {
			type: "space",
			name: e.slice(7)
		};
	}
	if (e.startsWith("datasets/")) {
		if (t > 2) throw TypeError("Too many slashes in repo designation: " + e);
		return {
			type: "dataset",
			name: e.slice(9)
		};
	}
	if (e.startsWith("buckets/")) {
		if (t !== 2) throw TypeError("Bucket Id must include namespace and name of the bucket");
		return {
			type: "bucket",
			name: e.slice(8)
		};
	}
	if (t > 1) throw TypeError("Too many slashes in repo designation: " + e);
	return {
		type: "model",
		name: e
	};
}
typeof window < "u" && window.document, typeof self == "object" && self.constructor && self.constructor.name, new Promise((e) => { });
var o = class extends Blob {
	static async create(e, t) {
		let n = t?.fetch ?? fetch, r = await n(e, {
			method: "HEAD",
			...t?.accessToken && { headers: { Authorization: `Bearer ${t.accessToken}` } }
		}), i = Number(r.headers.get("content-length")), a = r.headers.get("content-type") || "";
		return r.headers.get("accept-ranges") !== "bytes" || i < (t?.cacheBelow ?? 1e6) ? await (await n(e)).blob() : new o(e, 0, i, a, !0, n, t?.accessToken);
	}
	url;
	start;
	end;
	contentType;
	full;
	fetch;
	accessToken;
	constructor(e, t, n, r, i, a, o) {
		super([]), this.url = e, this.start = t, this.end = n, this.contentType = r, this.full = i, this.fetch = a, this.accessToken = o;
	}
	get size() {
		return this.end - this.start;
	}
	get type() {
		return this.contentType;
	}
	slice(e = 0, t = this.size) {
		return new o(this.url, this.start + e, Math.min(this.start + t, this.end), this.contentType, e === 0 && t === this.size ? this.full : !1, this.fetch, this.accessToken);
	}
	async arrayBuffer() {
		return (await this.fetchRange()).arrayBuffer();
	}
	async text() {
		return (await this.fetchRange()).text();
	}
	stream() {
		let e = new TransformStream();
		return this.fetchRange().then((t) => t.body?.pipeThrough(e)).catch((t) => e.writable.abort(t.message)), e.readable;
	}
	fetchRange() {
		let t = this.fetch;
		return this.full ? t(this.url, { ...this.accessToken && { headers: { Authorization: `Bearer ${this.accessToken}` } } }).then((t) => t.ok ? t : e(t)) : t(this.url, {
			headers: {
				Range: `bytes=${this.start}-${this.end - 1}`,
				...this.accessToken && { Authorization: `Bearer ${this.accessToken}` }
			}
		}).then((t) => t.ok ? t : e(t));
	}
};
function s(e, t) {
	let n = e.length, r = new Uint8Array(n + t.length);
	return r.set(e), r.set(t, n), r;
}
function c(e, t) {
	let n = 0;
	return n |= e[t++] << 0, n |= e[t++] << 8, n |= e[t++] << 16, n |= e[t++] << 24, n |= e[t++] << 32, n |= e[t++] << 40, n |= e[t++] << 48, n |= e[t++] << 56, n;
}
function l(e, t) {
	let n = 0;
	return n |= e[t++] << 0, n |= e[t++] << 8, n |= e[t++] << 16, n |= e[t++] << 24, n;
}
var u = 4, d = 65536;
C(5 << 20), S();
var f = 407708164, p = 4, m = 8, h = 16, g = 64, _ = 192, v = 2147483648, y = 4, b = 7, x = {
	4: 65536,
	5: 262144,
	6: 1048576,
	7: 4194304
};
function S() {
	try {
		return new Uint32Array(d);
	} catch {
		let e = Array(d);
		for (let t = 0; t < d; t++) e[t] = 0;
		return e;
	}
}
function C(e) {
	return new Uint8Array(e);
}
function w(e, t, n) {
	return e.slice(t, n);
}
function T(e) {
	let t = 0;
	if (l(e, t) !== f) throw Error("invalid magic number");
	t += 4;
	let n = e[t++];
	if ((n & _) !== g) throw Error("incompatible descriptor version " + (n & _));
	let r = (n & h) !== 0, i = (n & m) !== 0, a = e[t++] >> y & b;
	if (x[a] === void 0) throw Error("invalid block size " + a);
	let o = x[a];
	if (i) return c(e, t);
	t++;
	let s = 0;
	for (; ;) {
		let n = l(e, t);
		if (t += 4, n & v ? (n &= ~v, s += n) : n > 0 && (s += o), n === 0) return s;
		r && (t += 4), t += n;
	}
}
function E(e, t, n, r, i) {
	let a, o, s, c, l, d = t.copyWithin !== void 0 && t.fill !== void 0;
	for (s = n + r; n < s;) {
		let r = e[n++], f = r >> 4;
		if (f > 0) {
			if (f === 15) for (; f += e[n], e[n++] === 255;);
			for (c = n + f; n < c;) t[i++] = e[n++];
		}
		if (n >= s) break;
		if (a = r & 15, o = e[n++] | e[n++] << 8, a === 15) for (; a += e[n], e[n++] === 255;);
		if (a += u, d && o === 1) t.fill(t[i - 1] | 0, i, i + a), i += a;
		else if (d && o > a && a > 31) t.copyWithin(i, i - o, i - o + a), i += a;
		else for (l = i - o, c = l + a; l < c;) t[i++] = t[l++] | 0;
	}
	return i;
}
function D(e, t) {
	let n, r, i, a, o = 0, s = 0;
	if (l(e, o) !== f) throw Error("invalid magic number");
	if (o += 4, a = e[o++], (a & _) !== g) throw Error("incompatible descriptor version");
	if (n = (a & h) !== 0, r = (a & p) !== 0, i = (a & m) !== 0, x[e[o++] >> y & b] === void 0) throw Error("invalid block size");
	for (i && (o += 8), o++; ;) {
		var c = l(e, o);
		if (o += 4, c === 0) break;
		if (n && (o += 4), (c & v) !== 0) {
			c &= ~v;
			for (let n = 0; n < c; n++) t[s++] = e[o++];
		} else s = E(e, t, o, c, s), o += c;
	}
	return r && (o += 4), s;
}
function O(e, t) {
	let n, r;
	return t === void 0 && (t = T(e)), n = C(t), r = D(e, n), r !== t && (n = w(n, 0, r)), n;
}
var ee = class {
	ranges = [];
	add(e, t) {
		if (t <= e) throw TypeError("End must be greater than start");
		let n = [];
		for (let r = 0; r < this.ranges.length; r++) {
			let i = this.ranges[r];
			if (e < i.end && t > i.start && n.push({
				index: r,
				range: i
			}), i.data !== null) throw Error("Overlapping range already has data");
		}
		if (n.length === 0) {
			this.ranges.push({
				start: e,
				end: t,
				refCount: 1,
				data: null
			}), this.ranges.sort((e, t) => e.start - t.start);
			return;
		}
		let r = [], i = e;
		for (let e = 0; e < n.length; e++) {
			let { range: a } = n[e];
			i < a.start ? r.push({
				start: i,
				end: a.start,
				refCount: 1,
				data: null
			}) : a.start < i && r.push({
				start: a.start,
				end: i,
				refCount: a.refCount,
				data: null
			}), r.push({
				start: Math.max(i, a.start),
				end: Math.min(t, a.end),
				refCount: a.refCount + 1,
				data: null
			}), a.end > t && r.push({
				start: t,
				end: a.end,
				refCount: a.refCount,
				data: null
			}), i = Math.max(i, a.end);
		}
		i < t && r.push({
			start: i,
			end: t,
			refCount: 1,
			data: null
		});
		let a = n[0].index, o = n[n.length - 1].index;
		this.ranges.splice(a, o - a + 1, ...r), this.ranges.sort((e, t) => e.start - t.start);
	}
	remove(e, t) {
		if (t <= e) throw TypeError("End must be greater than start");
		let n = [];
		for (let r = 0; r < this.ranges.length; r++) {
			let i = this.ranges[r];
			e < i.end && t > i.start && n.push({
				index: r,
				range: i
			});
		}
		if (n.length === 0) throw Error("No ranges found to remove");
		if (e !== n[0].range.start || t !== n[n.length - 1].range.end) throw Error("Range boundaries must match existing boundaries");
		for (let e = 0; e < n.length; e++) {
			let { range: t } = n[e];
			t.refCount--;
		}
		this.ranges = this.ranges.filter((e) => e.refCount > 0);
	}
	getRanges(e, t) {
		if (t <= e) throw TypeError("End must be greater than start");
		return this.ranges.filter((n) => e < n.end && t > n.start);
	}
	getAllRanges() {
		return [...this.ranges];
	}
}, k = 6e4, A = 1e3, j = {
	0: "None",
	1: "LZ4",
	2: "ByteGroupingLZ4"
}, M = 8, N = class extends Blob {
	fetch;
	accessToken;
	refreshUrl;
	reconstructionUrl;
	hash;
	start = 0;
	end = 0;
	internalLogging = !1;
	reconstructionInfo;
	listener;
	constructor(e) {
		if (super([]), this.fetch = e.fetch ?? fetch.bind(globalThis), this.accessToken = i(e), this.refreshUrl = e.refreshUrl, this.end = e.size, this.reconstructionUrl = e.reconstructionUrl, this.hash = e.hash, this.listener = e.listener, this.internalLogging = e.internalLogging ?? !1, e.readToken) {
			let t = I({
				refreshUrl: this.refreshUrl,
				initialAccessToken: this.accessToken
			});
			F.set(t, {
				accessToken: e.readToken.accessToken,
				expiresAt: /* @__PURE__ */ new Date(e.readToken.exp * 1e3),
				casUrl: e.readToken.casUrl
			});
		}
	}
	get size() {
		return this.end - this.start;
	}
	#e() {
		let e = new N({
			fetch: this.fetch,
			hash: this.hash,
			refreshUrl: this.refreshUrl,
			reconstructionUrl: this.reconstructionUrl,
			size: this.size
		});
		return e.accessToken = this.accessToken, e.start = this.start, e.end = this.end, e.reconstructionInfo = this.reconstructionInfo, e.listener = this.listener, e.internalLogging = this.internalLogging, e;
	}
	slice(e = 0, t = this.size) {
		let n = this.#e();
		return n.start = this.start + e, n.end = Math.min(this.start + t, this.end), (n.start !== this.start || n.end !== this.end) && (n.reconstructionInfo = void 0), n;
	}
	#t;
	#n() {
		return this.#t ||= (async () => {
			let t = await ne(this.accessToken, this.fetch, this.refreshUrl), n = await this.fetch(this.reconstructionUrl ?? `${t.casUrl}/v1/reconstructions/${this.hash}`, {
				headers: {
					Authorization: `Bearer ${t.accessToken}`,
					Range: `bytes=${this.start}-${this.end - 1}`
				}
			});
			if (!n.ok) throw await e(n);
			return this.reconstructionInfo = await n.json(), this.reconstructionInfo;
		})().finally(() => this.#t = void 0), this.#t;
	}
	async #r() {
		if (this.size === 0) return new ReadableStream({
			start(e) {
				e.close();
			}
		});
		this.reconstructionInfo || await this.#n();
		let t = /* @__PURE__ */ new Map();
		if (!this.reconstructionInfo) throw Error("Failed to load reconstruction info");
		for (let e of this.reconstructionInfo.terms) {
			let n = t.get(e.hash);
			n || (n = new ee(), t.set(e.hash, n)), n.add(e.range.start, e.range.end);
		}
		let n = this.listener, r = this.internalLogging ? (...e) => console.log(...e) : () => { };
		async function* i(i, a, o, c) {
			let l = 0, u = i.offset_into_first_range;
			for (let d of i.terms) {
				if (l >= o) break;
				let f = t.get(d.hash);
				if (!f) throw Error(`Failed to find range list for term ${d.hash}`);
				{
					let e = f.getRanges(d.range.start, d.range.end);
					if (e.every((e) => e.data)) {
						r("all data available for term", d.hash, u);
						rangeLoop: for (let t of e) for (let e of t.data) {
							if (u) {
								let t = Math.min(u, e.byteLength);
								if (e = e.slice(t), u -= t, !e.byteLength) continue;
							}
							if (e.byteLength > o - l && (e = e.slice(0, o - l)), l += e.byteLength, yield t.refCount > 1 ? e.slice() : e, n?.({
								event: "progress",
								progress: {
									read: l,
									total: o
								}
							}), l >= o) break rangeLoop;
						}
						f.remove(d.range.start, d.range.end);
						continue;
					}
				}
				let p = i.fetch_info[d.hash].find((e) => e.range.start <= d.range.start && e.range.end >= d.range.end);
				if (!p) throw Error(`Failed to find fetch info for term ${d.hash} and range ${d.range.start}-${d.range.end}`);
				r("term", d), r("fetchinfo", p), r("readBytesToSkip", u);
				let m = await a(p.url, { headers: { Range: `bytes=${p.url_range.start}-${p.url_range.end}` } });
				if (m.status === 403 && (i = await c(), m = await a(p.url, { headers: { Range: `bytes=${p.url_range.start}-${p.url_range.end}` } })), !m.ok) throw await e(m);
				r("expected content length", m.headers.get("content-length"), "range", p.url_range, m.headers.get("content-range"));
				let h = m.body?.getReader();
				if (!h) throw Error("Failed to get reader from response body");
				let g = !1, _ = p.range.start, v = f.getRanges(p.range.start, p.range.end), y, b = 0;
				fetchData: for (; !g && l < o;) {
					let e = await h.read();
					if (n?.({ event: "read" }), g = e.done, r("read", e.value?.byteLength, "bytes", "total read", l, "toSkip", u), !e.value) {
						r("no data in result, cancelled", e);
						continue;
					}
					for (b += e.value.byteLength, y &&= (e.value = s(y, e.value), void 0); l < o && e.value?.byteLength;) {
						if (e.value.byteLength < 8) {
							y = e.value;
							continue fetchData;
						}
						let t = new DataView(e.value.buffer, e.value.byteOffset, M), i = {
							version: t.getUint8(0),
							compressed_length: t.getUint8(1) | t.getUint8(2) << 8 | t.getUint8(3) << 16,
							compression_scheme: t.getUint8(4),
							uncompressed_length: t.getUint8(5) | t.getUint8(6) << 8 | t.getUint8(7) << 16
						};
						if (r("chunk header", i, "to skip", u), i.version !== 0) throw Error(`Unsupported chunk version ${i.version}`);
						if (i.compression_scheme !== 0 && i.compression_scheme !== 1 && i.compression_scheme !== 2) throw Error(`Unsupported compression scheme ${j[i.compression_scheme] ?? i.compression_scheme}`);
						if (e.value.byteLength < i.compressed_length + M) {
							y = e.value;
							continue fetchData;
						}
						e.value = e.value.slice(M);
						let a = i.compression_scheme === 1 ? O(e.value.slice(0, i.compressed_length), i.uncompressed_length) : i.compression_scheme === 2 ? te(O(e.value.slice(0, i.compressed_length), i.uncompressed_length)) : e.value.slice(0, i.compressed_length), s = v.find((e) => _ >= e.start && _ < e.end), c = _ >= d.range.start && _ < d.range.end, f = c ? 2 : 1, p = !1;
						if (s && s.refCount >= f && (s.data ??= [], s.data.push(a), p = !0), c) {
							if (u) {
								let e = Math.min(u, a.byteLength);
								a = a.slice(u), u -= e;
							}
							a.byteLength > o - l && (a = a.slice(0, o - l)), a.byteLength && (r("yield", a.byteLength, "bytes", e.value.byteLength, "total read", l, p), l += a.byteLength, yield p ? a.slice() : a, n?.({
								event: "progress",
								progress: {
									read: l,
									total: o
								}
							}));
						}
						_++, e.value = e.value.slice(i.compressed_length);
					}
				}
				if (g && l < o && b < p.url_range.end - p.url_range.start + 1) throw r("done", g, "total read", l, o, b), r("failed to fetch all data for term", d.hash), Error(`Failed to fetch all data for term ${d.hash}, fetched ${b} bytes out of ${p.url_range.end - p.url_range.start + 1}`);
				r("done", g, "total read", l, o, b), r("cancel reader"), await h.cancel();
			}
		}
		let a = i(this.reconstructionInfo, this.fetch, this.end - this.start, this.#n.bind(this));
		return new ReadableStream({
			async pull(e) {
				let t = await a.next();
				t.value && e.enqueue(t.value), t.done && e.close();
			},
			type: "bytes"
		}, { highWaterMark: 1e3 });
	}
	async arrayBuffer() {
		let e = await this.#r();
		return new Response(e).arrayBuffer();
	}
	async text() {
		let e = await this.#r();
		return new Response(e).text();
	}
	async response() {
		let e = await this.#r();
		return new Response(e);
	}
	stream() {
		let e = new TransformStream();
		return this.#r().then((t) => t.pipeThrough(e)).catch((t) => e.writable.abort(t.message)), e.readable;
	}
}, P = /* @__PURE__ */ new Map(), F = /* @__PURE__ */ new Map();
function I(e) {
	return JSON.stringify([e.refreshUrl, e.initialAccessToken]);
}
function te(e) {
	let t = Math.floor(e.byteLength / 4), n = e.byteLength % 4, r = t + +(n >= 1), i = r + t + +(n >= 2), a = i + t + +(n == 3), o = new Uint8Array(e.byteLength);
	for (let t = 0, n = 0; t < e.byteLength; t += 4, n++) o[t] = e[n];
	for (let t = 1, n = r; t < e.byteLength; t += 4, n++) o[t] = e[n];
	for (let t = 2, n = i; t < e.byteLength; t += 4, n++) o[t] = e[n];
	for (let t = 3, n = a; t < e.byteLength; t += 4, n++) o[t] = e[n];
	return o;
}
async function ne(e, t, n) {
	let r = I({
		refreshUrl: n,
		initialAccessToken: e
	}), i = F.get(r);
	if (i && i.expiresAt > new Date(Date.now() + k)) return {
		accessToken: i.accessToken,
		casUrl: i.casUrl
	};
	let a = P.get(r);
	if (a) return a;
	let o = (async () => {
		let i = await t(n, { headers: { ...e ? { Authorization: `Bearer ${e}` } : {} } });
		if (!i.ok) throw Error(`Failed to get JWT token: ${i.status} ${await i.text()}`);
		let a = await i.json(), o = {
			accessToken: a.accessToken,
			expiresAt: /* @__PURE__ */ new Date(a.exp * 1e3),
			casUrl: a.casUrl
		};
		P.delete(r);
		for (let [e, t] of F.entries()) if (t.expiresAt < new Date(Date.now() + k)) F.delete(e);
		else break;
		if (F.size >= A) {
			let e = F.keys().next().value;
			e && F.delete(e);
		}
		return F.set(r, o), {
			accessToken: a.accessToken,
			casUrl: a.casUrl
		};
	})();
	return P.set(r, o), o;
}
"ff".repeat(32), new Uint8Array([
	72,
	70,
	82,
	101,
	112,
	111,
	77,
	101,
	116,
	97,
	68,
	97,
	116,
	97,
	0,
	85,
	105,
	103,
	69,
	106,
	123,
	129,
	87,
	131,
	165,
	189,
	217,
	92,
	205,
	209,
	74,
	169
]);
function re(e) {
	return Object.fromEntries([...e.matchAll(/<(https?:[/][/][^>]+)>;\s+rel="([^"]+)"/g)].map(([, e, t]) => [t, e]));
}
async function ie(t) {
	let r = i(t), o = a(t.repo), s = t.hubUrl ?? "https://huggingface.co", c = o.type === "bucket" ? void 0 : t.revision ?? "main", l = `${s}/${o.type === "model" ? "" : `${o.type}s/`}${o.name}/${t.raw ? "raw" : "resolve"}${c ? `/${encodeURIComponent(c)}` : ""}/${t.path}` + (t.noContentDisposition ? "?noContentDisposition=1" : ""), u = await (t.fetch ?? fetch)(l, {
		method: "GET",
		headers: {
			...r && { Authorization: `Bearer ${r}` },
			Range: "bytes=0-0",
			Accept: "application/vnd.xet-fileinfo+json, */*"
		}
	});
	if (u.status === 404 && u.headers.get("X-Error-Code") === "EntryNotFound") return null;
	if (!u.ok) throw await e(u);
	let d, f;
	if (u.headers.get("Content-Type")?.includes("application/vnd.xet-fileinfo+json")) {
		if (d = parseInt(u.headers.get("X-Linked-Size") ?? "invalid"), isNaN(d)) throw new n("Invalid file size received in X-Linked-Size header");
		let e = u.headers.get("X-Xet-Hash"), t = re(u.headers.get("Link") ?? ""), r = (() => {
			try {
				return new URL(t["xet-reconstruction-info"]);
			} catch {
				return null;
			}
		})(), i = (() => {
			try {
				return new URL(t["xet-auth"]);
			} catch {
				return null;
			}
		})();
		if (!e) throw new n("No hash received in X-Xet-Hash header");
		if (!r || !i) throw new n("No xet-reconstruction-info or xet-auth link header");
		f = {
			hash: e,
			refreshUrl: i,
			reconstructionUrl: r
		};
	}
	if (d === void 0 || isNaN(d)) {
		let e = u.headers.get("content-range");
		if (!e) throw new n("Expected size information");
		let [, t] = e.split("/");
		if (d = parseInt(t), isNaN(d)) throw new n("Invalid file size received");
	}
	let p = u.headers.get("X-Linked-ETag") ?? u.headers.get("ETag") ?? void 0;
	if (!p) throw new n("Expected ETag");
	return {
		etag: p,
		size: d,
		xet: f,
		url: u.url && (new URL(u.url).origin === new URL(s).origin || u.headers.get("X-Cache")?.endsWith(" cloudfront")) ? u.url : l
	};
}
async function ae(e) {
	let t = i(e), n = e.downloadInfo ?? await ie({
		accessToken: t,
		repo: e.repo,
		path: e.path,
		revision: e.revision,
		hubUrl: e.hubUrl,
		fetch: e.fetch,
		raw: e.raw
	});
	return n ? n.xet && e.xet !== !1 ? new N({
		refreshUrl: n.xet.refreshUrl.href,
		reconstructionUrl: n.xet.reconstructionUrl.href,
		fetch: e.fetch,
		accessToken: t,
		size: n.size,
		readToken: typeof e.xet == "object" ? e.xet.readToken : void 0
	}) : new o(new URL(n.url), 0, n.size, "", !0, e.fetch ?? fetch, t) : null;
}
//#endregion
//#region src/control-asset-sw.ts
var L = self;
async function R(e) {
	let t = await crypto.subtle.digest("SHA-256", e);
	return Array.from(new Uint8Array(t)).map((e) => e.toString(16).padStart(2, "0")).join("");
}
async function z(e, t) {
	return (await R(e)).toLowerCase() === t.toLowerCase();
}
var B = "infra", V = "voices", H = {
	"ort-wasm-simd-threaded.wasm": "be0e129949062ad50290ef94683fac8be5bb6156f709e030b7a5f1661a2f6c17",
	"ort.wasm.min.mjs": "d5a6d7bc8ee587648fb3742dde8c0094d17cbd3822a68bbec8ddfcd4f2adb88e",
	"ort-wasm-simd-threaded.mjs": "5687566b1bc1c8cf628d76c2ddb16b2a3b81a7997273d4666564880495088e57",
	"piper_phonemize.data": "29f1025eb23a5b5c192cd14a6efbce4509402ff265405072ee6f7d1a09b78f8c",
	"piper_phonemize.js": "fef0c2fc442d24fdef5c7c7cc37d5da2314407640fe11ab1bfe347c723dff19b",
	"piper_phonemize.wasm": "b777cd107a91d2bcc6a1ea46f2c26a662a7407394fe84589198aeaa83dd7a9d6",
	"process-piper-synthesis.worker.js": "3003b45c74ab87062f444182c401acbbb5109272c93a003cdfe045c5a66d8cc4",
	"piper-callback.js": "c769d1f2b9d5ee7f0cb97858d68a21c2e1fc86312981d71f098560060e13f81b"
}, U = {
	"ort-wasm-simd-threaded.wasm": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/ort-wasm-simd-threaded.wasm",
	"ort.wasm.min.mjs": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/ort.wasm.min.mjs",
	"ort-wasm-simd-threaded.mjs": "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/ort-wasm-simd-threaded.mjs",
	"piper_phonemize.data": "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data",
	"piper_phonemize.js": "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.js",
	"piper_phonemize.wasm": "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm"
}, W = {
	"en_US-bryce-medium": {
		onnx: "330c232c12b8a08eb241599190f2ee8ccd6072dce323d10e06684fb0cde8a241",
		config: "7ceb1bc4af6d4e41b6d1edbb86c67e91e01eaa71f66db4cd0ae92ac704d415be"
	},
	"en_US-ljspeech-high": {
		onnx: "16e472d4e0b95134c67ebbc7fcb06c92b242adf3ea41f4f2630aaf172349227c",
		config: "7e1f4634af596d83cca997fb7a931ba80b70f8a316a2655ee69c55365e0ace14"
	},
	"en_US-kristin-medium": {
		onnx: "f6f2c0e13b186ca0ceae53c4bf0e0dcd4533a8af496c3ee851272275538fb874",
		config: "5681426d4aead22195de70531eeeeddb46493cfaffc5764b2ea3db73428b651c"
	},
	"en_US-arctic-medium": {
		onnx: "87057d77bee2a3104a65655adf2d7a1c70ab93b50c8d37c690dbf5660391e4ff",
		config: "db2ca1a55db01cdd3ce28ae63037ac525133e9e00ca557430dec572643235efe"
	},
	"en_GB-cori-medium": {
		onnx: "30b6781fbf12ea790f67bb8f2aca550fbc83ab63178d62d181b6aa8369172d29",
		config: "e262c16d7f192f69d4edd6b4ef8a5915379e67495fcc402f1ab15eeb33da3d36"
	},
	"en_US-libritts-high": {
		onnx: "5478bb7603d3b7f6e6fc94a3df720647217bc73e4059a6caa7d2bf3f34840376",
		config: "2efdc6d7f954588b8180132cbd9b8001933fdd00932c92bc92fd0d2028a9eb3d"
	},
	"nl_NL-alex-medium": {
		onnx: "a0a8607801723803898cacc2c0708fc9e7a05ee96bcd4fa2a9464a5102bfb79e",
		config: "9ea643871742c038511b6aaf20e6fc098a78a11968122d2f6ca3e50403423f95"
	},
	"nl_BE-rdh-medium": {
		onnx: "71fbf84e2601f41727b59032e224f676b2c5bae24ad0b4ae52fdb9267d08c741",
		config: "65deb256664d22099b0db5bb36d96237a3e32e43885c6ce4ee6811e6c04a8d79"
	},
	"sv_SE-alma-medium": {
		onnx: "748ea1721d9399bffdab7120fddc66bf444127d3ac8d79e7d50aa73bc3a6991d",
		config: "6924380892f769afa92fc6b28ff91d558690d7fb4e3ef8cbf821cefadc8f38fe"
	},
	"sv_SE-nst-medium": {
		onnx: "99ed2539d568c01598f15d1c175c0795f0cee61588baa77dc663edaab30dd9ce",
		config: "d45dd74cbb4eca58694bf04a97e243044092476f28a55ae26424f0653086980a"
	},
	"uk_UA-ukrainian_tts-medium": {
		onnx: "3d9412227941720605876329ca2be7b9bcce6d8265779b483d6050b7c497045a",
		config: "4e96e72917ca9b94edc77d6ccfee03a73f450ba2fc1ca93c2e562bc014e5aa55"
	}
}, G = {
	"en_US-bryce-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/male/Bryce/en_US-bryce-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/male/Bryce/en_US-bryce-medium.onnx.json"
	},
	"en_US-ljspeech-high": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/female/Ljspeech/en_US-ljspeech-high.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/female/Ljspeech/en_US-ljspeech-high.onnx.json"
	},
	"en_US-kristin-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/female/Kristin/en_US-kristin-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/female/Kristin/en_US-kristin-medium.onnx.json"
	},
	"en_US-arctic-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/female/Arctic/en_US-arctic-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/female/Arctic/en_US-arctic-medium.onnx.json"
	},
	"en_GB-cori-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/UK/female/Cori/en_GB-cori-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/UK/female/Cori/en_GB-cori-medium.onnx.json"
	},
	"en_US-libritts-high": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/multi/Libritts/en_US-libritts-high.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/english/US/multi/Libritts/en_US-libritts-high.onnx.json"
	},
	"nl_NL-alex-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/dutch/NL/male/Alex/nl_NL-alex-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/dutch/NL/male/Alex/nl_NL-alex-medium.onnx.json"
	},
	"nl_BE-rdh-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/dutch/BE/male/Rdh/nl_BE-rdh-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/dutch/BE/male/Rdh/nl_BE-rdh-medium.onnx.json"
	},
	"sv_SE-alma-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/swedish/female/Alma/sv_SE-alma-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/swedish/female/Alma/sv_SE-alma-medium.onnx.json"
	},
	"sv_SE-nst-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/swedish/male/Nst/sv_SE-nst-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/swedish/male/Nst/sv_SE-nst-medium.onnx.json"
	},
	"uk_UA-ukrainian_tts-medium": {
		onnx: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/ukrainian/multi/UkrainianTts/uk_UA-ukrainian_tts-medium.onnx",
		config: "https://huggingface.co/rinaldow/piper-onnx-durations/resolve/main/ukrainian/multi/UkrainianTts/uk_UA-ukrainian_tts-medium.onnx.json"
	}
}, K = {
	".wasm": "application/wasm",
	".mjs": "text/javascript",
	".js": "text/javascript",
	".data": "application/octet-stream",
	".onnx": "application/octet-stream",
	".json": "application/json"
}, q = new BroadcastChannel("piper-download-progress");
function oe(e, t) {
	let n = t instanceof Error;
	q.postMessage({
		type: "error",
		filename: e,
		message: n ? t.message : String(t),
		stack: n ? t.stack : void 0,
		code: n ? t.name : "UNKNOWN_ERROR"
	});
}
function se(e) {
	return !!(e in H || e.endsWith(".onnx") || e.endsWith(".onnx.json"));
}
L.addEventListener("install", () => {
	L.skipWaiting();
}), L.addEventListener("activate", (e) => {
	e.waitUntil(L.clients.claim());
}), L.addEventListener("fetch", (e) => {
	let t = new URL(e.request.url);
	if (t.origin === L.location.origin && !t.pathname.startsWith("/piper-gate/")) {
		let e = t.pathname.split("/").pop() || "";
		se(e) && console.warn(`[piper-gate] [Path Deviation] Detected request for Piper asset '${e}' at non-gateway path: ${t.pathname}. This request bypasses Service Worker integrity verification and OPFS caching. Please update the requester to use: /piper-gate/.../${e}`);
	}
	if (t.origin !== L.location.origin || !t.pathname.startsWith("/piper-gate/")) return;
	let n = t.pathname.slice(12);
	if (n) {
		if (e.request.method === "DELETE") {
			e.respondWith(de(n));
			return;
		}
		e.respondWith(ce(n, e.request));
	}
});
async function ce(e, t) {
	try {
		let n = e.split("/");
		if (n.length !== 2) return new Response(`[piper-gate] Invalid path format: ${e}`, { status: 400 });
		let [r, i] = n;
		return r === "infra" ? await le(i) : r === "voices" ? await ue(i, t) : new Response(`[piper-gate] Unknown directory: ${r}`, { status: 400 });
	} catch (t) {
		return oe(e, t), new Response(t instanceof Error ? t.message : String(t), {
			status: 500,
			statusText: "Piper Gateway Resolver Error"
		});
	}
}
async function le(e) {
	let t = H[e];
	if (!t) return new Response(`[piper-gate] Unknown infra asset: ${e}`, { status: 404 });
	let n = await X(B, e);
	if (n) {
		if (await z(n, t)) return console.log(`[piper-gate] [Cache Hit] '${e}' verified from OPFS.`), $(n, { filename: e });
		console.log(`[piper-gate] [Stale Cache] OPFS integrity mismatch for '${e}'. Deleting stale entry to trigger re-fetch.`), await Q(B, e);
	}
	try {
		let n = await fetch(`/piper-gate/infra/${e}`);
		if (n.ok) {
			let r = await n.arrayBuffer();
			if (await z(r, t)) return await Z(B, e, r), console.log(`[piper-gate] [Cache Restored] '${e}' successfully re-downloaded, verified, and persisted to OPFS.`), $(r, { filename: e });
			console.error(`[piper-gate] Local infra asset integrity mismatch: ${e}`);
		}
	} catch { }
	let r = U[e];
	if (!r) return new Response(`[piper-gate] No CDN URL for infra asset: ${e}`, { status: 404 });
	try {
		let n = await fetch(r);
		if (!n.ok) return new Response(`[piper-gate] CDN returned ${n.status} for: ${e}`, { status: 502 });
		let i = await n.arrayBuffer();
		return await z(i, t) ? (await Z(B, e, i), console.log(`[piper-gate] Infra asset from CDN verified: ${e}`), $(i, { filename: e })) : new Response(`[piper-gate] CDN asset integrity mismatch: ${e}`, { status: 403 });
	} catch (t) {
		return console.error(`[piper-gate] CDN fetch failed for ${e}:`, t), new Response(`[piper-gate] CDN unreachable for: ${e}`, { status: 502 });
	}
}
async function ue(e, t) {
	let n = e.endsWith(".onnx.json"), r = n ? e.slice(0, -10) : e.slice(0, -5), i = n ? "config" : "onnx", a = t.headers.get("x-piper-cache-download") === "true", o = null, s = W[r];
	if (s && (o = i === "onnx" ? s.onnx ?? null : s.config ?? null), !o) {
		let e = t.headers.get(`x-piper-sha256-${i}`);
		e && (o = e);
	}
	if (!o) {
		let e = t.headers.get(`x-piper-url-${i}`);
		e && (o = await Y(e));
	}
	if (!o) return console.error(`[piper-gate] No SHA-256 available for voice: ${e}`), new Response(`[piper-gate] SHA-256 required for voice asset: ${e}. Provide via x-piper-sha256-${i} header or use a registered model.`, { status: 403 });
	let c = await X(V, e);
	if (c) {
		if (await z(c, o)) return console.log(`[piper-gate] [Cache Hit] Voice asset verified from OPFS: ${e}`), $(c, { filename: e });
		console.log(`[piper-gate] [Stale Cache] Voice integrity mismatch for '${e}'. Purging stale entry.`), await Q(V, e);
	}
	let l = null;
	if (s && G[r]) {
		let e = G[r];
		l = i === "onnx" ? e.onnx : e.config;
	}
	if (!l) {
		let e = t.headers.get(`x-piper-url-${i}`);
		e && (l = e);
	}
	if (!l) return new Response(`[piper-gate] No source URL for voice: ${e}`, { status: 404 });
	try {
		let n = J(l), r, i = 0;
		if (n) {
			console.log(`[piper-gate] Using HF Hub download for: ${e}`);
			let a = await ae({
				repo: n.repo,
				revision: n.revision,
				path: n.path,
				fetch: (e, n) => fetch(e, {
					...n,
					signal: t.signal
				})
			});
			if (!a) return new Response(`[piper-gate] HF Hub failed to resolve: ${e}`, { status: 502 });
			i = a.size, q.postMessage({
				type: "progress",
				filename: e,
				downloaded: i,
				total: i
			}), r = await a.arrayBuffer();
		} else {
			let n = await fetch(l, { signal: t.signal });
			if (!n.ok) return new Response(`[piper-gate] Source returned ${n.status} for: ${e}`, { status: 502 });
			i = Number(n.headers.get("Content-Length")) || 0;
			let a = n.body?.getReader();
			if (!a) return new Response(`[piper-gate] No response body for: ${e}`, { status: 502 });
			let o = [], s = 0, c = 0;
			try {
				for (; ;) {
					let { done: t, value: n } = await a.read();
					if (t) break;
					o.push(n), s += n.length;
					let r = Date.now();
					r - c > 100 && (q.postMessage({
						type: "progress",
						filename: e,
						downloaded: s,
						total: i || s
					}), c = r);
				}
			} finally {
				a.releaseLock();
			}
			r = await new Blob(o).arrayBuffer();
		}
		return await z(r, o) ? (await Z(V, e, r), console.log(`[piper-gate] [Cache Restored] Voice asset '${e}' downloaded and verified.`), a ? $(null, {
			status: 204,
			extraHeaders: { "x-piper-sha256": o }
		}) : $(r, { filename: e })) : (console.error(`[piper-gate] Voice asset integrity mismatch: ${e}`), new Response(`[piper-gate] Integrity mismatch for: ${e}`, { status: 403 }));
	} catch (t) {
		return t instanceof Error && t.name === "AbortError" ? new Response(`[piper-gate] Download aborted: ${e}`, { status: 499 }) : (console.error(`[piper-gate] Download failed for ${e}:`, t), new Response(`[piper-gate] Download failed for: ${e}`, { status: 502 }));
	}
}
function J(e) {
	let t = e.match(/^https:\/\/huggingface\.co\/([^/]+\/[^/]+)\/resolve\/([^/]+)\/(.+)$/);
	return t ? {
		repo: t[1],
		revision: t[2],
		path: t[3]
	} : null;
}
async function Y(e) {
	let t = J(e);
	if (!t) return null;
	try {
		let e = t.path.split("/"), n = e.pop() || "", r = e.join("/"), i = `https://huggingface.co/api/models/${t.repo}/tree/${t.revision}/${r}`, a = await fetch(i);
		return a.ok && (await a.json()).find((e) => e.path === t.path || e.path.endsWith(n))?.lfs?.oid || null;
	} catch {
		return null;
	}
}
async function X(e, t) {
	try {
		return await (await (await (await (await navigator.storage.getDirectory()).getDirectoryHandle(e, { create: !1 })).getFileHandle(t, { create: !1 })).getFile()).arrayBuffer();
	} catch {
		return null;
	}
}
async function Z(e, t, n) {
	try {
		let r = await (await (await (await navigator.storage.getDirectory()).getDirectoryHandle(e, { create: !0 })).getFileHandle(t, { create: !0 })).createWritable();
		await r.write(n), await r.close();
	} catch (n) {
		console.warn(`[piper-gate] OPFS write failed for ${e}/${t}:`, n);
	}
}
async function Q(e, t) {
	try {
		await (await (await navigator.storage.getDirectory()).getDirectoryHandle(e, { create: !1 })).removeEntry(t);
	} catch { }
}
async function de(e) {
	try {
		let t = await navigator.storage.getDirectory();
		if (e === "voices/" || e === "voices") {
			try {
				await t.removeEntry("voices", { recursive: !0 }), console.log("[piper-gate] Voice cache cleared (recursive)");
			} catch (e) {
				if (!(e instanceof Error && (e.name === "NotFoundError" || e.message.toLowerCase().includes("not found")))) throw e;
			}
			return new Response(null, { status: 204 });
		}
		if (e === "infra/" || e === "infra") {
			try {
				await t.removeEntry("infra", { recursive: !0 }), console.log("[piper-gate] Infra asset cache cleared (recursive)");
			} catch (e) {
				if (!(e instanceof Error && (e.name === "NotFoundError" || e.message.toLowerCase().includes("not found")))) throw e;
			}
			return new Response(null, { status: 204 });
		}
		if (e.startsWith("voices/")) {
			let n = e.slice(7);
			if (!n) return new Response("[piper-gate] Missing modelId for deletion", { status: 400 });
			let r = await t.getDirectoryHandle("voices", { create: !1 }).catch(() => null);
			if (r) {
				for (let e of [".onnx", ".onnx.json"]) try {
					await r.removeEntry(`${n}${e}`);
				} catch (e) {
					if (!(e instanceof Error && (e.name === "NotFoundError" || e.message.toLowerCase().includes("not found")))) throw e;
				}
				console.log(`[piper-gate] Model assets purged: ${n}`);
			}
			return new Response(null, { status: 204 });
		}
		return new Response(`[piper-gate] Unsupported deletion path: ${e}`, { status: 400 });
	} catch (t) {
		return console.error(`[piper-gate] Deletion failed for ${e}:`, t), new Response("[piper-gate] Internal OPFS Error", { status: 500 });
	}
}
function $(e, t = {}) {
	let { filename: n, status: r = 200, extraHeaders: i = {} } = t, a = {
		"x-piper-sw": "verified",
		"Cross-Origin-Resource-Policy": "same-origin",
		...i
	};
	return n && (a["Content-Type"] = K[n.substring(n.lastIndexOf("."))] ?? "application/octet-stream"), new Response(e, {
		status: r,
		headers: a
	});
}
//#endregion
