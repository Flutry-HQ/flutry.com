import { motion } from 'motion/react';
import { LuCircleAlert } from 'react-icons/lu';
import { useSearchParams } from 'react-router';
import { useLanguage } from '~/utils/services/language/context';

const DEFAULT_ERROR_TYPE = 'boundary';

export default function Error() {
  const { t, messages } = useLanguage();
  const [searchParams] = useSearchParams();

  const requestedType = searchParams.get('type') ?? DEFAULT_ERROR_TYPE;

  // Csak akkor használjuk a kért típust, ha valóban létezik hozzá fordítás
  // a betöltött messages-ben. Ha nincs (pl. valaki ?type=asdasd-et ír be
  // az URL-be), essünk vissza a default "boundary" hibaoldalra, hogy ne
  // nyers i18n kulcsok jelenjenek meg a felhasználónak.
  const errorMessages = messages.error;
  const isValidType = typeof errorMessages === 'object' && errorMessages !== null && requestedType in errorMessages;

  const type = isValidType ? requestedType : DEFAULT_ERROR_TYPE;

  return (
    <div className="relative flex items-center justify-center overflow-hidden">
      <div className="relative z-10 w-full max-w-md text-center">
        <div>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400"
          >
            <LuCircleAlert size={48} />
          </motion.div>

          <h1 className="mb-2 text-3xl font-bold text-slate-100">{t(`error.${type}.title`)}</h1>

          <p className="mb-6 text-sm text-slate-400">{t(`error.${type}.headline`)}</p>

          <div className="mb-6 text-sm text-slate-400">{t(`error.${type}.description`)}</div>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/"
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500/40 hover:bg-indigo-500/50 disabled:bg-indigo-800/60 px-5 py-3 font-medium text-white transition"
            >
              {t(`error.${type}.button`)}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
