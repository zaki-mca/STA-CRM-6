import { BaseController } from '../utils/baseController';

class CategoryController extends BaseController {
  constructor() {
    super('product_categories');
  }
}

export default new CategoryController(); 