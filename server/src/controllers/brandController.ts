import { BaseController } from '../utils/baseController';

class BrandController extends BaseController {
  constructor() {
    super('product_brands');
  }
}

export default new BrandController(); 