import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import Spinner from './Spinner';

export default function PagePreloader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onLoad = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          setLoading(false);
        }, 100);
      });
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);

      return () => {
        window.removeEventListener('load', onLoad);
      };
    }
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          exit={{ opacity: 0 }}
          className={`fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-999`}
        >
          <Spinner />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
