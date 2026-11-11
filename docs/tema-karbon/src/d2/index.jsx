import PhoneFrame, { PanelFrame } from '../shell/PhoneFrame.jsx';
import Ozet from './Ozet.jsx';
import Takip from './Takip.jsx';
import Diger from './Diger.jsx';
import Butonlar from './Butonlar.jsx';

export default function D2() {
  return (
    <div className="flex w-max items-start gap-10">
      <PhoneFrame label="01 · Özet" bg="#14110F"><Ozet /></PhoneFrame>
      <PhoneFrame label="02 · Takip" bg="#14110F"><Takip /></PhoneFrame>
      <PhoneFrame label="03 · Diğer" bg="#14110F"><Diger /></PhoneFrame>
      <PanelFrame label="04 · Butonlar" width={760}><Butonlar /></PanelFrame>
    </div>
  );
}
