import { c } from '../theme.js';
import PhoneFrame, { PanelFrame } from '../shell/PhoneFrame.jsx';
import Ozet from './Ozet.jsx';
import Takip from './Takip.jsx';
import Diger from './Diger.jsx';
import Butonlar from './Butonlar.jsx';

export default function D1() {
  return (
    <div className="flex w-max items-start gap-10">
      <PhoneFrame label="01 · Özet" bg={c.k0}><Ozet /></PhoneFrame>
      <PhoneFrame label="02 · Takip" bg={c.k0}><Takip /></PhoneFrame>
      <PhoneFrame label="03 · Diğer" bg={c.k0}><Diger /></PhoneFrame>
      <PanelFrame label="04 · Butonlar" width={720}><Butonlar /></PanelFrame>
    </div>
  );
}
