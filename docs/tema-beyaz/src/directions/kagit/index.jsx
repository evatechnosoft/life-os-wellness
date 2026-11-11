import PhoneFrame from '../../components/PhoneFrame.jsx';
import Ozet from './Ozet.jsx';
import Takip from './Takip.jsx';
import Diger from './Diger.jsx';
import Butonlar from './Butonlar.jsx';

export default function KagitDirection() {
  return (
    <div className="flex gap-10 items-start">
      <PhoneFrame label="01 · Özet"><Ozet /></PhoneFrame>
      <PhoneFrame label="02 · Takip"><Takip /></PhoneFrame>
      <PhoneFrame label="03 · Diğer"><Diger /></PhoneFrame>
      <Butonlar />
    </div>
  );
}
