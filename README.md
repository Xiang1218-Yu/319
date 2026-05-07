# 客观世界模拟系统

本项目是一个基于 Three.js 的生成式艺术与物理模拟系统。它不仅是视觉上的粒子特效，更是一个具有惯性、记忆和不可逆演化逻辑的世界模型。

## 🚀 快速启动

1. 使用浏览器打开 `index.html` 文件即可运行。

## 🌌 核心设计哲学

1. **非指令式响应**：世界不直接执行控制指令，而是根据“世界状态参数”进行自我演化。
2. **秩序的潜伏**：世界最初呈现为“无意义的美”。结构（如圣诞树）始终存在于底层数学中，但仅在世界高度和谐（**一致性 > 0.5**）时才被允许显现。
3. **物理涌现**：和谐度不是参数的镜像，而是通过粒子在空间中真实的物理聚合状态计算出来的涌现属性。
4. **记忆惯性**：世界具有记忆。曾经达到的最大和谐度会转化为世界的稳定性，使秩序前崩塌后更易重建。

## 🏗️ 系统架构说明

系统采用高度模块化的类结构实现，分为以下六大核心子系统：

- **TimeSystem**: 管理模拟步长（deltaTime）与全局运行周期（worldTime），提供用于模拟“世界呼吸”的低频脉冲（Pulse）。
- **FieldSystem**: 构建基于噪声的连续流场。支持大尺度气流模拟及对称性镜像干预。
- **StructureSystem**: 基于 **SDF (Signed Distance Function)** 定义世界的潜在线索。目前实现为一个具有 4 层折射轮廓的圣诞树场。
- **ParticleSystem**: 管理“具有倾向的实体”。每个粒子包含内在意志、亲和力、速度方向及物理惯性。
- **MemorySystem**: 追踪世界演化史。记录瞬时和谐度与历史峰值，并计算由此产生的历史权重。
- **RenderSystem**: 定制化 GLSL 着色器渲染。实现灵动的“魂火”效果，支持速度感知的粒子拉伸与动态闪烁。

## 🦴 核心模块骨架

```javascript
// 1. 时间系统：系统的跳动心脏
class TimeSystem {
  constructor() {
    this.worldTime = 0;
    this.deltaTime = 0;
  }
  update() {
    /* 计算帧间隔，更新全局时间 */
  }
  getPulse() {
    /* 返回用于呼吸感的正弦波 */
  }
}

// 2. 结构系统：秩序的蓝图 (SDF)
class StructureSystem {
  constructor() {
    this.intensity = 0; // 秩序显现的强度
  }
  getSDF(pos) {
    /* 圣诞树 4 层分层圆锥数学定义 */
  }
  getAttraction(pos) {
    /* 计算梯度并产生向表面的引力 */
  }
}

// 3. 粒子实体：具有意志的微观单位
class ParticleEntity {
  constructor() {
    this.velocity = new THREE.Vector3();
    this.will = Math.random(); // 内在驱动惯性
    this.affinity = Math.random(); // 对结构的向往度
  }
}

// 4. 记忆系统：历史对未来的干预
class MemorySystem {
  constructor() {
    this.currentHarmony = 0; // 物理上的真实聚合评分
    this.maxHarmony = 0; // 历史达到的峰值
  }
  update(alignmentScore, deltaTime) {
    /* 记录记忆并计算历史权重 */
  }
}

// 5. 世界控制器：对外唯一接口
class WorldSimulation {
  constructor(container) {
    this.state = { coherence, turbulence, symmetry, colorTemp };
  }
  applyWorldParams(params) {
    /* 平滑应用外部参数，驱动演化 */
  }
  update() {
    /* 驱动所有子系统协同演进 */
  }
}
```

## 🎨 视觉美学说明

- **缥缈感**: 通过大幅降低物理阻尼（0.985）和高幂次边缘衰减（4.5）实现，粒子如烟雾般在场中滑行。
- **实体感**: 粒子着色器根据瞬时速度进行动态拉伸，展现出运动的“倾向方向”。
- **色彩体系**: 支持从冷紫到暖金的色温调节，模拟记忆在空间中折射出的不同情感底色。

## 🛠️ 交互接口

世界层仅接受以下抽象参数，所有变化均经过低通滤波平滑处理：

| 参数           | 视觉描述 | 对应逻辑意义                           |
| :------------- | :------- | :------------------------------------- |
| **Coherence**  | 一致性   | 引力引导秩序显现的强度                 |
| **Turbulence** | 混乱度   | 撕裂结构的随机流场力量                 |
| **Symmetry**   | 对称性   | 镜像平衡力，决定秩序是无机的还是理性的 |
| **Color Temp** | 色温     | 世界整体光致感官的情绪基调             |

---
