import { LAppPal } from "./lapppal";
import speechsdk from 'microsoft-cognitiveservices-speech-sdk';

export class AzureAi {
  private _openaiurl: string;
  private _openaipikey: string;
  private _ttsapikey: string;
  private _ttsregion: string;

  private _inProgress: boolean;

  constructor() {
    this._openaiurl = (document.getElementById("openaiurl") as any).value;
    this._openaipikey = (document.getElementById("openaipikey") as any).value;
    this._ttsregion = (document.getElementById("ttsregion") as any).value;
    this._ttsapikey = (document.getElementById("ttsapikey") as any).value;

    this._inProgress = false;
  }

  async getOpenAiAnswer() {
    const prompt = (document.getElementById("prompt") as any).value;

    if(this._inProgress) return "";

    this._inProgress = true;

    const conversations = (document.getElementById("conversations") as any).value;
    LAppPal.printMessage(prompt);

    const conversation = conversations + "\n\n## " + prompt
    const m = {
      "prompt": `##${conversation}\n\n`,
      "max_tokens": 150,
      "temperature": 0,
      "frequency_penalty": 0,
      "presence_penalty": 0,
      "top_p": 1,
      "stop": ["#", ";"]
    }

    const repsonse = await fetch(this._openaiurl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this._openaipikey,
      },
      body: JSON.stringify(m)
    });
    const json = await repsonse.json();
    const answer: string = json.choices[0].text
    LAppPal.printMessage(answer);
    (document.getElementById("reply") as any).value = answer;
    (document.getElementById("conversations") as any).value = conversations + "\n\n" + answer;

    return answer;
  }

  async getSpeechUrl(text: string) {
    const requestHeaders: HeadersInit = new Headers();
    requestHeaders.set('Content-Type', 'application/ssml+xml');
    requestHeaders.set('X-Microsoft-OutputFormat', 'riff-8khz-16bit-mono-pcm');
    requestHeaders.set('Ocp-Apim-Subscription-Key', this._ttsapikey);

    const ssml = `<speak version=\'1.0\' xml:lang=\'en-US\'>
              <voice xml:lang=\'en-US\' xml:gender=\'Female\' name=\'en-US-JennyNeural\'>
                  ${text}
              </voice>
            </speak>`

    const response = await fetch(`https://${this._ttsregion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: requestHeaders,
      body: ssml
    });

    const blob = await response.blob();

    var url = window.URL.createObjectURL(blob)
    const audio: any = document.getElementById('voice');
    audio.src = url;
    LAppPal.printMessage(`Load Text to Speech url`);
    this._inProgress = false;
    return url;
  }
}
