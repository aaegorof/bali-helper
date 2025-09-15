'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

type AnimationConfig = {
  globalTime: number;
  hexagons: {
    x: number;
    y: number;
    vertices: { x: number; y: number }[];
  }[];
  connections: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    hex1Index: number;
    hex2Index: number;
  }[];
  waves: number[][];
  centerIndex: number;
  hexagonProgress: {
    progress: number;
    waveIndex: number;
    isActive: boolean;
    isCompleted: boolean;
    activationTime: number;
  }[];
  waveDelay: number;
};

const HexagonPattern = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [hexSize, setHexSize] = useState(16);
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [strokeColor, setStrokeColor] = useState('#333333');
  const [speedFactor, setSpeedFactor] = useState<[number, number]>([1, 10]);
  const [startDelay, setStartDelay] = useState<number>(3);
  const [fillColor, setFillColor] = useState('transparent');
  const [showFill, setShowFill] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(10);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConnections, setShowConnections] = useState(true);

  // Состояние анимации
  const [animationState, setAnimationState] = useState<AnimationConfig>({
    globalTime: 0, // Глобальное время анимации
    hexagons: [],
    connections: [],
    waves: [],
    centerIndex: -1,
    hexagonProgress: [], // Индивидуальный прогресс для каждого гексагона
    waveDelay: 0.4, // Задержка между волнами
  });

  // Генерация данных о гексагонах и соединениях
  const generateHexagonData = useCallback(() => {
    const canvas = canvasRef.current as unknown as HTMLCanvasElement;
    if (!canvas)
      return { hexagons: [], connections: [], waves: [], centerIndex: -1, hexagonProgress: [] };

    const hexWidth = hexSize * 2;
    const hexHeight = hexSize * Math.sqrt(3);
    const horizontalSpacing = hexWidth * 0.75;
    const verticalSpacing = hexHeight;

    const cols = Math.ceil(canvas.width / horizontalSpacing) + 2;
    const rows = Math.ceil(canvas.height / verticalSpacing) + 2;

    const hexagons = [];
    const connections = [];

    // Генерируем гексагоны
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * horizontalSpacing;
        const y = row * verticalSpacing + (col % 2) * (verticalSpacing / 2);

        if (
          x + hexSize >= 0 &&
          x - hexSize <= canvas.width &&
          y + hexSize >= 0 &&
          y - hexSize <= canvas.height
        ) {
          const hexagon = {
            x,
            y,
            vertices: [],
            row,
            col,
            gridRow: row,
            gridCol: col,
            speedFactor: speedFactor[0] + Math.random() * speedFactor[1], // Случайный коэффициент скорости от 0.3 до 1.3
            startDelay: Math.random() * startDelay, // Случайная задержка старта от 0 до 1.2
          };

          // Вычисляем вершины
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            hexagon.vertices.push({
              x: x + hexSize * Math.cos(angle),
              y: y + hexSize * Math.sin(angle),
            });
          }

          hexagons.push(hexagon);
        }
      }
    }

    // Находим центральный гексагон (ближайший к центру canvas)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let centerIndex = 0;
    let minDistToCenter = Infinity;

    for (let i = 0; i < hexagons.length; i++) {
      const dist = Math.sqrt(
        Math.pow(hexagons[i].x - centerX, 2) + Math.pow(hexagons[i].y - centerY, 2)
      );
      if (dist < minDistToCenter) {
        minDistToCenter = dist;
        centerIndex = i;
      }
    }
    console.log(centerIndex);
    // Генерируем волны распространения от центра
    const waves = [];
    const visited = new Set<number>();
    let currentWave = [centerIndex];
    visited.add(centerIndex);

    while (currentWave.length > 0) {
      waves.push([...currentWave]);
      const nextWave = [];

      for (const hexIndex of currentWave) {
        const hex = hexagons[hexIndex];

        // Находим соседей
        for (let i = 0; i < hexagons.length; i++) {
          if (visited.has(i)) continue;

          const neighbor = hexagons[i];
          const dx = Math.abs(hex.gridCol - neighbor.gridCol);
          const dy = Math.abs(hex.gridRow - neighbor.gridRow);

          // Проверяем, является ли соседом в гексагональной сетке
          let isNeighbor = false;
          if (dx === 1 && dy === 0) isNeighbor = true;
          else if (dx === 0 && dy === 1) isNeighbor = true;
          else if (dx === 1 && dy === 1) {
            // Диагональные соседи зависят от четности колонки
            if (hex.gridCol % 2 === 0) {
              isNeighbor = neighbor.gridRow === hex.gridRow || neighbor.gridRow === hex.gridRow + 1;
            } else {
              isNeighbor = neighbor.gridRow === hex.gridRow || neighbor.gridRow === hex.gridRow - 1;
            }
          }

          if (isNeighbor) {
            nextWave.push(i);
            visited.add(i);
          }
        }
      }

      currentWave = nextWave;
    }

    // Генерируем соединения между соседними гексагонами
    if (showConnections) {
      for (let i = 0; i < hexagons.length; i++) {
        const hex1 = hexagons[i];
        for (let j = i + 1; j < hexagons.length; j++) {
          const hex2 = hexagons[j];

          // Проверяем, являются ли гексагоны соседними
          const dx = Math.abs(hex1.gridCol - hex2.gridCol);
          const dy = Math.abs(hex1.gridRow - hex2.gridRow);

          let isNeighbor = false;
          if (dx === 1 && dy === 0) isNeighbor = true;
          else if (dx === 0 && dy === 1) isNeighbor = true;
          else if (dx === 1 && dy === 1) {
            if (hex1.gridCol % 2 === 0) {
              isNeighbor = hex2.gridRow === hex1.gridRow || hex2.gridRow === hex1.gridRow + 1;
            } else {
              isNeighbor = hex2.gridRow === hex1.gridRow || hex2.gridRow === hex1.gridRow - 1;
            }
          }

          if (isNeighbor) {
            // Находим ближайшие вершины для соединения
            let minDist = Infinity;
            let connection = null;

            for (let v1 = 0; v1 < 6; v1++) {
              for (let v2 = 0; v2 < 6; v2++) {
                const dist = Math.sqrt(
                  Math.pow(hex1.vertices[v1].x - hex2.vertices[v2].x, 2) +
                    Math.pow(hex1.vertices[v1].y - hex2.vertices[v2].y, 2)
                );

                if (dist < minDist && dist < hexSize * 0.1) {
                  minDist = dist;
                  connection = {
                    from: hex1.vertices[v1],
                    to: hex2.vertices[v2],
                    hex1Index: i,
                    hex2Index: j,
                  };
                }
              }
            }

            if (connection) {
              connections.push(connection);
            }
          }
        }
      }
    }

    // Инициализируем прогресс для каждого гексагона
    const hexagonProgress = hexagons.map((hexagon, index) => {
      // Находим к какой волне относится гексагон
      let waveIndex = -1;
      for (let i = 0; i < waves.length; i++) {
        if (waves[i].includes(index)) {
          waveIndex = i;
          break;
        }
      }

      return {
        progress: 0,
        waveIndex: waveIndex,
        isActive: false,
        isCompleted: false,
        activationTime: -1, // Время когда гексагон должен активироваться
      };
    });

    return { hexagons, connections, waves, centerIndex, hexagonProgress };
  }, [hexSize, showConnections, speedFactor, startDelay]);

  // Функция рисования части линии
  const drawPartialLine = (
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    progress: number
  ) => {
    const currentX = from.x + (to.x - from.x) * progress;
    const currentY = from.y + (to.y - from.y) * progress;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
  };

  // Функция рисования гексагона по частям
  const drawPartialHexagon = (
    ctx: CanvasRenderingContext2D,
    hexagon: { vertices: { x: number; y: number }[] },
    currentSide: number,
    progress: number,
    fill = false
  ) => {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    // Рисуем заливку если нужно
    if (fill && showFill && fillColor !== 'transparent' && currentSide >= 6) {
      ctx.beginPath();
      ctx.moveTo(hexagon.vertices[0].x, hexagon.vertices[0].y);
      for (let i = 1; i < 6; i++) {
        ctx.lineTo(hexagon.vertices[i].x, hexagon.vertices[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // Рисуем завершенные стороны
    for (let i = 0; i < currentSide; i++) {
      const from = hexagon.vertices[i];
      const to = hexagon.vertices[(i + 1) % 6];

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }

    // Рисуем текущую сторону частично
    if (currentSide < 6) {
      const from = hexagon.vertices[currentSide];
      const to = hexagon.vertices[(currentSide + 1) % 6];
      drawPartialLine(ctx, from, to, progress);
    }
  };

  // Основная функция анимации
  const animate = useCallback(() => {
    const canvas = canvasRef.current as unknown as HTMLCanvasElement;
    if (!canvas || !isAnimating) return;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { hexagons, connections, hexagonProgress, waveDelay } = animationState;

    // Рисуем все гексагоны в зависимости от их состояния
    for (let i = 0; i < hexagons.length; i++) {
      const progressData = hexagonProgress[i];
      if (!progressData) continue;

      if (progressData.isCompleted) {
        drawPartialHexagon(ctx, hexagons[i], 6, 1, true);
      } else if (progressData.isActive) {
        const sidesCompleted = Math.floor(progressData.progress * 6);
        const currentSideProgress = (progressData.progress * 6) % 1;

        drawPartialHexagon(ctx, hexagons[i], sidesCompleted, currentSideProgress, true);
      }
    }

    // Рисуем соединения для завершенных гексагонов
    if (showConnections) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth * 0.5;
      ctx.globalAlpha = 0.6;

      for (const connection of connections) {
        const hex1Progress = hexagonProgress[connection.hex1Index];
        const hex2Progress = hexagonProgress[connection.hex2Index];

        // Рисуем соединение только если оба гексагона завершены
        if (hex1Progress?.isCompleted && hex2Progress?.isCompleted) {
          ctx.beginPath();
          ctx.moveTo(connection.from.x, connection.from.y);
          ctx.lineTo(connection.to.x, connection.to.y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    // Обновляем состояние анимации
    setAnimationState((prev) => {
      const newState = { ...prev };
      const timeStep = 0.02 * (animationSpeed / 50);
      newState.globalTime += timeStep;

      let hasActiveHexagons = false;
      let allCompleted = true;

      // Обновляем состояние каждого гексагона
      for (let i = 0; i < newState.hexagonProgress.length; i++) {
        const progressData = newState.hexagonProgress[i];
        const hexagon = newState.hexagons[i];

        if (progressData.isCompleted) {
          continue;
        }

        allCompleted = false;

        // Вычисляем время активации гексагона (волна + индивидуальная задержка)
        const waveStartTime = progressData.waveIndex * waveDelay;
        const activationTime = waveStartTime + hexagon.startDelay;

        // Активируем гексагон если пришло его время
        if (!progressData.isActive && newState.globalTime >= activationTime) {
          progressData.isActive = true;
          progressData.activationTime = newState.globalTime;
        }

        // Обновляем прогресс активных гексагонов
        if (progressData.isActive && !progressData.isCompleted) {
          hasActiveHexagons = true;

          // Вычисляем прогресс с учетом индивидуального коэффициента скорости
          const timeSinceActivation = newState.globalTime - progressData.activationTime;
          const speedMultiplier = hexagon.speedFactor;
          progressData.progress = Math.min(1, timeSinceActivation * speedMultiplier * 0.6);

          if (progressData.progress >= 1) {
            progressData.progress = 1;
            progressData.isCompleted = true;
            progressData.isActive = false;
          }
        }
      }

      // Завершаем анимацию, если все гексагоны завершены
      if (allCompleted) {
        setIsAnimating(false);
        return prev;
      }

      return newState;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [
    isAnimating,
    animationState,
    strokeColor,
    strokeWidth,
    showFill,
    fillColor,
    animationSpeed,
    showConnections,
  ]);

  // Запуск анимации
  const startAnimation = () => {
    const data = generateHexagonData();
    setAnimationState({
      globalTime: 0,
      hexagons: data.hexagons,
      connections: data.connections,
      waves: data.waves,
      centerIndex: data.centerIndex,
      hexagonProgress: data.hexagonProgress,
      waveDelay: 0.7,
    });
    setIsAnimating(true);
  };

  // Остановка анимации
  const stopAnimation = () => {
    setIsAnimating(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Статичное рисование
  const drawStatic = useCallback(() => {
    const canvas = canvasRef.current as unknown as HTMLCanvasElement;
    if (!canvas || isAnimating) return;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { hexagons, connections } = generateHexagonData();

    // Рисуем все гексагоны
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    for (const hexagon of hexagons) {
      if (showFill && fillColor !== 'transparent') {
        ctx.beginPath();
        ctx.moveTo(hexagon.vertices[0].x, hexagon.vertices[0].y);
        for (let i = 1; i < 6; i++) {
          ctx.lineTo(hexagon.vertices[i].x, hexagon.vertices[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.moveTo(hexagon.vertices[0].x, hexagon.vertices[0].y);
      for (let i = 1; i < 6; i++) {
        ctx.lineTo(hexagon.vertices[i].x, hexagon.vertices[i].y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Рисуем соединения
    if (showConnections) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth * 0.5;
      ctx.globalAlpha = 0.6;

      for (const connection of connections) {
        ctx.beginPath();
        ctx.moveTo(connection.from.x, connection.from.y);
        ctx.lineTo(connection.to.x, connection.to.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }, [
    hexSize,
    strokeWidth,
    strokeColor,
    fillColor,
    showFill,
    showConnections,
    isAnimating,
    generateHexagonData,
  ]);

  // Эффекты
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    if (!isAnimating) {
      drawStatic();
    }
  }, [drawStatic]);

  useEffect(() => {
    if (isAnimating) {
      animate();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, isAnimating]);

  useEffect(() => {
    const handleResize = () => {
      if (!isAnimating) {
        setTimeout(drawStatic, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawStatic, isAnimating]);

  return (
    <div className="w-full h-screen bg-gray-100 flex">
      {/* Панель управления */}
      <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Управление паттерном</h2>

        {/* Управление анимацией */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">Анимация</h3>
          <div className="space-y-3">
            <button
              onClick={startAnimation}
              disabled={isAnimating}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              {isAnimating ? 'Анимация идет...' : 'Запустить анимацию'}
            </button>
            <button
              onClick={stopAnimation}
              disabled={!isAnimating}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
            >
              Остановить
            </button>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Скорость анимации: {animationSpeed}%
            </label>
            <input
              type="range"
              min="1"
              max="200"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Размер гексагона */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Размер гексагона: {hexSize}px
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={hexSize}
            onChange={(e) => setHexSize(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Толщина линий */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Толщина линий: {strokeWidth}px
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Коэффициент скорости */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Коэффициент скорости: {speedFactor[0]} - {speedFactor[1]}
          </label>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Минимум: {speedFactor[0]}</label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={speedFactor[0]}
                onChange={(e) => setSpeedFactor([Number(e.target.value), speedFactor[1]])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Максимум: {speedFactor[1]}</label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={speedFactor[1]}
                onChange={(e) => setSpeedFactor([speedFactor[0], Number(e.target.value)])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Задержка старта */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Задержка старта: {startDelay}с
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={startDelay}
            onChange={(e) => setStartDelay(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Цвет линий */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Цвет линий</label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="#333333"
            />
          </div>
        </div>

        {/* Соединения */}
        <div className="mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showConnections"
              checked={showConnections}
              onChange={(e) => setShowConnections(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="showConnections" className="text-sm font-medium text-gray-700">
              Показать соединения между гексагонами
            </label>
          </div>
        </div>

        {/* Заливка */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="showFill"
              checked={showFill}
              onChange={(e) => setShowFill(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="showFill" className="text-sm font-medium text-gray-700">
              Включить заливку
            </label>
          </div>

          {showFill && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Цвет заливки</label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={fillColor === 'transparent' ? '#ffffff' : fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Предустановки */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Быстрые настройки</label>
          <div className="space-y-2">
            <button
              onClick={() => {
                setHexSize(25);
                setStrokeWidth(1);
                setStrokeColor('#333333');
                setShowFill(false);
                setShowConnections(true);
                setSpeedFactor([1, 10]);
                setStartDelay(3);
              }}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm transition-colors"
            >
              Стандартный
            </button>
            <button
              onClick={() => {
                setHexSize(40);
                setStrokeWidth(2);
                setStrokeColor('#0066cc');
                setFillColor('#e6f3ff');
                setShowFill(true);
                setShowConnections(false);
                setSpeedFactor([0.5, 2]);
                setStartDelay(1);
              }}
              className="w-full px-4 py-2 bg-blue-200 hover:bg-blue-300 rounded-md text-sm transition-colors"
            >
              Синий с заливкой
            </button>
            <button
              onClick={() => {
                setHexSize(35);
                setStrokeWidth(1.5);
                setStrokeColor('#ff6600');
                setShowFill(false);
                setShowConnections(true);
                setAnimationSpeed(40);
                setSpeedFactor([0.3, 0.8]);
                setStartDelay(5);
              }}
              className="w-full px-4 py-2 bg-orange-200 hover:bg-orange-300 rounded-md text-sm transition-colors"
            >
              Снежинка (медленно)
            </button>
            <button
              onClick={() => {
                setHexSize(20);
                setStrokeWidth(1);
                setStrokeColor('#00cc66');
                setShowFill(false);
                setShowConnections(true);
                setAnimationSpeed(80);
                setSpeedFactor([2, 8]);
                setStartDelay(0.5);
              }}
              className="w-full px-4 py-2 bg-green-200 hover:bg-green-300 rounded-md text-sm transition-colors"
            >
              Быстрая волна
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded-md text-sm text-gray-600">
          {isAnimating ? (
            <div>
              <div>Время: {animationState.globalTime?.toFixed(1)}с</div>
              <div className="text-xs text-gray-500 mt-1">
                Активных: {animationState.hexagonProgress?.filter((p) => p?.isActive).length || 0} |
                Завершено:{' '}
                {animationState.hexagonProgress?.filter((p) => p?.isCompleted).length || 0}
              </div>
              <div className="text-xs text-gray-500">
                Всего волн: {animationState.waves?.length || 0}
              </div>
            </div>
          ) : (
            'Гексагональный паттерн'
          )}
        </div>
      </div>
    </div>
  );
};

export default HexagonPattern;
