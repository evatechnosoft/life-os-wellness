import PhoneFrame from '../../components/PhoneFrame.jsx';
import Ozet from './Ozet.jsx';
import Takip from './Takip.jsx';
import Diger from './Diger.jsx';
import Butonlar from './Butonlar.jsx';

export default function PopDirection() {
  const ring = 'ring-2 ring-pop-ink';
  return (
    <div className="flex gap-10 items-start">
      <PhoneFrame label="01 · Özet" className={ring}><Ozet /></PhoneFrame>
      <PhoneFrame label="02 · Takip" className={ring}><Takip /></PhoneFrame>
      <PhoneFrame label="03 · Diğer" className={ring}><Diger /></PhoneFrame>
      <Butonlar />
    </div>
  );
}
