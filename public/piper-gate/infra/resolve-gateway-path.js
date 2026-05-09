//#region src/utils/resolve-gateway-path.ts
function e(e, t) {
	return t ? t.endsWith("/") ? t : `${t}/` : `${e.substring(0, e.lastIndexOf("/") + 1)}piper-gate/`;
}
function t(e) {
	let t = `${e}infra/`;
	return {
		onnx: {
			wasm: t,
			mjs: `${t}ort.wasm.min.mjs`
		},
		phonemize: {
			data: `${t}piper_phonemize.data`,
			js: `${t}piper_phonemize.js`,
			wasm: `${t}piper_phonemize.wasm`
		},
		infra: {
			modelCards: `${t}piper-model-cards.json`,
			callback: `${t}piper-callback.js`
		}
	};
}
//#endregion
export { e as n, t };
