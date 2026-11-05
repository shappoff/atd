import { Progress } from "@base-ui/react/progress";
import styles from "./PlacesLoadProgress.module.css";

type PlacesLoadProgressProps = {
  value: number | null;
};

export function PlacesLoadProgress({ value }: PlacesLoadProgressProps) {
  return (
    <Progress.Root
      className={styles.root}
      value={value}
      aria-label="Загрузка населённых пунктов"
      getAriaValueText={(formatted, current) =>
        current == null
          ? "Загрузка населённых пунктов"
          : `Загрузка населённых пунктов: ${formatted}`
      }
    >
      <Progress.Track className={styles.track}>
        <Progress.Indicator className={styles.indicator} />
      </Progress.Track>
    </Progress.Root>
  );
}
