import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { VisuallyHidden } from "../visually-hidden/visually-hidden.js";
import styles from "./line-chart.module.css";
import type { LineChartProps, LineChartSeries } from "./line-chart.types.js";

const DEFAULT_TICKS = [0, 20, 40, 60, 80, 100];
const percent = (value: number) => `${String(value)}%`;
const toneColor = (series: LineChartSeries) => `var(--blast-${series.tone}-chart)`;

export function LineChart({
  ariaLabel,
  data,
  xKey,
  series,
  yTickFormatter = percent,
  xTickFormatter,
  height = 160,
  yDomain = [0, 100],
  yTicks = DEFAULT_TICKS,
}: LineChartProps) {
  const renderTooltip = ({ active, payload, label }: TooltipContentProps) => {
    if (!active || payload.length === 0) return null;
    const title = typeof label === "string" ? (xTickFormatter?.(label) ?? label) : String(label);
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipTitle}>{title}</p>
        {series.map((s) => {
          const entry = payload.find((p) => p.dataKey === s.key);
          if (!entry) return null;
          return (
            <p key={s.key} className={styles.tooltipRow} data-tone={s.tone}>
              <span className={styles.swatch} aria-hidden="true" />
              {s.label}: {yTickFormatter(Number(entry.value))}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <figure className={styles.figure} aria-label={ariaLabel}>
      <div className={styles.plot} aria-hidden="true">
        <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 600, height }}>
          <RechartsLineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical horizontal={false} strokeDasharray="4 4" />
            <XAxis
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              interval="preserveStartEnd"
              {...(xTickFormatter ? { tickFormatter: xTickFormatter } : {})}
            />
            <YAxis
              domain={yDomain}
              ticks={yTicks}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={yTickFormatter}
            />
            <Tooltip content={renderTooltip} cursor={{ stroke: "var(--blast-gray-300)" }} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="linear"
                dataKey={s.key}
                name={s.label}
                stroke={toneColor(s)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
      <ul className={styles.legend} aria-hidden="true">
        {series.map((s) => (
          <li key={s.key} className={styles.legendItem} data-tone={s.tone}>
            <span className={styles.swatch} />
            {s.label}
          </li>
        ))}
      </ul>
      <VisuallyHidden>
        <table>
          <caption>{ariaLabel}</caption>
          <thead>
            <tr>
              <th scope="col">{xKey}</th>
              {series.map((s) => (
                <th key={s.key} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const x = row[xKey];
              const xText = x === undefined ? "" : String(x);
              return (
                <tr key={`${xText}-${String(index)}`}>
                  <th scope="row">{xTickFormatter ? xTickFormatter(xText) : xText}</th>
                  {series.map((s) => (
                    <td key={s.key}>{yTickFormatter(Number(row[s.key]))}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </VisuallyHidden>
    </figure>
  );
}
