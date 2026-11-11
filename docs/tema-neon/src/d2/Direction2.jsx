import './poster.css';
import OzetPhone from './OzetPhone.jsx';
import TakipPhone from './TakipPhone.jsx';
import DigerPhone from './DigerPhone.jsx';
import ButtonsPanel from './ButtonsPanel.jsx';

export default function Direction2() {
  return (
    <div className="flex gap-12 items-start px-12 pb-16 pt-6 min-w-max">
      <OzetPhone />
      <TakipPhone />
      <DigerPhone />
      <ButtonsPanel />
    </div>
  );
}
