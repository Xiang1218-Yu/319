async function bootstrap() {
  const container = document.getElementById('canvasContainer');
  if (!container) {
    console.error('[WorldSimulation] canvasContainer DOM 元素未找到，无法初始化');
    if (window.showFallbackUI) {
      window.showFallbackUI('页面结构异常，缺少渲染容器，请刷新重试');
    }
    return;
  }

  let WorldSimulation;
  let UIController;

  try {
    const worldModule = await import('./WorldSimulation.js');
    WorldSimulation = worldModule.default;
  } catch (importError) {
    console.error('[WorldSimulation] 逻辑模块加载失败:', importError.message);
    if (window.showFallbackUI) {
      window.showFallbackUI('核心模块加载失败，请检查网络连接后刷新页面');
    }
    return;
  }

  try {
    const uiModule = await import('./UIController.js');
    UIController = uiModule.default;
  } catch (importError) {
    console.error('[WorldSimulation] UI 模块加载失败:', importError.message);
  }

  let world;
  try {
    world = WorldSimulation.getInstance(container);
  } catch (initError) {
    console.error('[WorldSimulation] 世界模拟系统初始化失败:', initError.message);
    if (window.showFallbackUI) {
      window.showFallbackUI('3D 引擎初始化失败，可能由于 WebGL 不受支持或资源加载异常');
    }
    return;
  }

  let ui = null;
  if (UIController) {
    try {
      ui = UIController.getInstance(world);
      ui.bindControls();
    } catch (uiError) {
      console.error('[WorldSimulation] UI 控制器初始化失败:', uiError.message);
    }
  }

  let animating = true;
  function animate() {
    if (!animating) return;
    requestAnimationFrame(animate);
    try {
      world.update();
      if (ui) ui.syncUI();
    } catch (updateError) {
      console.error('[WorldSimulation] 运行时更新异常:', updateError.message);
      animating = false;
    }
  }
  animate();

  window.worldLayer = world;
}

bootstrap().catch((err) => {
  console.error('[WorldSimulation] 启动失败:', err.message);
  if (window.showFallbackUI) {
    window.showFallbackUI('系统启动失败，请刷新页面重试');
  }
});
