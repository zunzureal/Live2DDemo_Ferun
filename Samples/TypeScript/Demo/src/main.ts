/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { LAppDelegate } from './lappdelegate';
import * as LAppDefine from './lappdefine';

export type Chatlog = {
  message: string;
  type: 'reply' | 'ask';
  role: 'assistant' | 'user' | 'system';
  displayName: string;
};

/**
 * ブラウザロード後の処理
 */
window.onload = (): void => {
  // create the application instance
  if (LAppDelegate.getInstance().initialize() == false) {
    return;
  }

  LAppDelegate.getInstance().run();
};

/**
 * 終了時の処理
 */
window.onbeforeunload = (): void => LAppDelegate.releaseInstance();

/**
 * Process when changing screen size.
 */
window.onresize = () => {
  if (LAppDefine.CanvasSize === 'auto') {
    LAppDelegate.getInstance().onResize();
  }
};

(window as any).startVoiceConversation = async (
  language: string,
  prompt: string,
  log: Chatlog[],
  data: Blob
) => {
  return LAppDelegate.getInstance().startVoiceConversation(
    language,
    prompt,
    log,
    data
  );
};
