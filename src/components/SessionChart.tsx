import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Sample } from '../lib/engine'

export default function SessionChart({ samples }: { samples: Sample[] }) {
  const data = [{ seconds: 0, wpm: 0, raw: 0, accuracy: 100 }, ...samples]
  return (
    <div className="chart-section">
      <div className="chart-heading">
        <h3>Velocidad</h3>
        <div className="chart-legend">
          <span>
            <i className="legend-dot teal" /> WPM
          </span>
          <span>
            <i className="legend-dot muted" /> Bruta
          </span>
        </div>
      </div>
      <div
        className="session-chart"
        role="img"
        aria-label={`Evolucion de la velocidad: ${samples.at(0)?.wpm ?? 0} a ${samples.at(-1)?.wpm ?? 0} palabras por minuto`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: -20 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="seconds"
              type="number"
              domain={[0, 'dataMax']}
              tickFormatter={(value) =>
                `${value < 10 ? Number(value.toFixed(1)) : Math.round(value)}s`
              }
              stroke="var(--muted)"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            />
            <YAxis
              stroke="var(--muted)"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            />
            <Tooltip
              labelFormatter={(value) => `${Number(value).toFixed(1)} s`}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Line
              name="WPM"
              dataKey="wpm"
              type="monotone"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              name="Bruta"
              dataKey="raw"
              type="monotone"
              stroke="var(--muted)"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="chart-data">
        <summary>Datos de la sesi&oacute;n</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Segundos</th>
                <th>WPM</th>
                <th>Bruta</th>
                <th>Precisi&oacute;n</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample, index) => (
                <tr key={index}>
                  <td>{sample.seconds.toFixed(1)}</td>
                  <td>{sample.wpm}</td>
                  <td>{sample.raw}</td>
                  <td>{sample.accuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
