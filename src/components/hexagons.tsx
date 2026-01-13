import React from 'react';

interface HexagonGridProps<T> {
  items: T[];
  columns?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerClassName?: string;
  itemClassName?: string;
  gap?: string;
  style?: React.CSSProperties;
}

export function HexagonGrid<T>({
  items,
  renderItem,
  columns = 12,
  gap = '0.5rem',
  containerClassName = '',
  itemClassName = '',
  style = {},
}: HexagonGridProps<T>) {
  const cycleLength = columns + (columns - 1); // 8 + 7 = 15 элементов на полный цикл
  const paddingTop = `calc((100cqw - var(--gap) * (var(--columns) - 1)) / var(--columns) * sqrt(3) / 2 * 0.2929)`;

  return (
    <div
      style={
        {
          '--padding-top': paddingTop,
          '--columns': columns,
          '--gap': gap,
          '--hex-shift': '29.29%',
          ...style,
        } as React.CSSProperties
      }
      className={`grid grid-cols-[repeat(var(--columns),1fr)] gap-[var(--gap)] w-full pt-[var(--padding-top)] ${containerClassName}`}
    >
      {items.map((item, index) => {
        const posInCycle = index % cycleLength; // позиция в цикле из 15 элементов
        const isOddRow = posInCycle < columns; // первые 8 элементов - нечетный ряд
        const cycleNumber = Math.floor(index / cycleLength); // номер цикла
        const rowPattern = cycleNumber * 2 + (isOddRow ? 0 : 1); // номер строки

        return (
          <div
            key={index}
            className={`hex-item relative overflow-hidden -mt-[--hex-shift] outline outline-offset-[-1px] ${itemClassName}`}
            style={
              {
                gridRow: rowPattern + 1,
                // marginRight: isOddRow ? '0' : '-50%',
                // transform: isOddRow ? 'translateX(0)' : `translateX(calc(50% + var(--gap) / 2))`,
                marginRight: isOddRow ? '0' : `calc(calc(50% + var(--gap) / 2) * -1)`,
                marginLeft: isOddRow ? '0' : `calc(50% + var(--gap) / 2)`,
                '--animation-delay': `${index * 0.03}s`,
              } as React.CSSProperties
            }
          >
            {renderItem(item, index)}
          </div>
        );
      })}

      <style jsx>{`
        div:has(> .hex-item) {
          container-type: inline-size;
        }

        @keyframes hexFadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .hex-item {
          aspect-ratio: calc(1 * sqrt(3) / 2);
          border-radius: 50% / 25%;
          corner-shape: bevel;

          /* Анимация появления */

          animation-delay: var(--animation-delay, 0s);
          //   opacity: 0;
        }

        .hex-item::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          inset: 0;
          margin: auto;
          border-radius: inherit;
          corner-shape: inherit;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

// Example usage component with simple data
interface ExampleItem {
  id: number;
  content: string;
  color?: string;
}

export function HexagonGridExample() {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd'];

  const items: ExampleItem[] = Array.from({ length: 40 }, (_, i) => ({
    id: i + 1,
    content: String(i + 1),
    color: colors[i % colors.length],
  }));

  return (
    <div>
      <div className="relative">
        <HexagonGrid
          items={items}
          style={{ '--padding-top': '0px' } as React.CSSProperties}
          gap="0rem"
          itemClassName="outline-red-500/10 hover:scale-[2] hover:bg-red-500/10 transition-all duration-200"
          renderItem={(item) => (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
              //   style={{ backgroundColor: item.color }}
              style={{ color: item.color }}
            >
              {item.content}
            </div>
          )}
        />
        <HexagonGrid
          items={items.slice(0, 15)}
          gap="0rem"
          columns={6}
          style={{ '--padding-top': '0px' } as React.CSSProperties}
          containerClassName="absolute top-0 left-0 w-full -z-10"
          itemClassName="outline-red-500/10"
          renderItem={(item) => (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
              //   style={{ backgroundColor: item.color }}
              style={{ color: item.color }}
            >
              {/* {item.content} */}
            </div>
          )}
        />
      </div>
      <HexagonGrid
        items={items}
        gap="0.25rem"
        itemClassName="outline-none"
        renderItem={(item) => (
          <div
            className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: item.color }}
          >
            {item.content}
          </div>
        )}
      />
    </div>
  );
}
