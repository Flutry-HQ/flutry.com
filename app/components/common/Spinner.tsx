import { motion } from 'motion/react';
export default function Spinner({
  animate = false,
  fixed = false,
  size = '4rem',
  color = '#6366f1',
}: {
  animate?: boolean;
  fixed?: boolean;
  size?: string;
  color?: string;
}) {
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        exit={{ opacity: 0 }}
        className={`${
          fixed
            ? 'fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-999'
            : 'flex items-center justify-center'
        }`}
      >
        <svg id="loader" stroke={color} width={size} viewBox="25 25 50 50" strokeWidth="2">
          <circle cx="50" cy="50" r="20" fill="none"></circle>
        </svg>
      </motion.div>
    );
  } else {
    return (
      <div
        className={`${
          fixed
            ? 'fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-999'
            : 'flex items-center justify-center'
        }`}
      >
        <svg id="loader" stroke={color} width={size} viewBox="25 25 50 50" strokeWidth="2">
          <circle cx="50" cy="50" r="20" fill="none"></circle>
        </svg>
      </div>
    );
  }
}
