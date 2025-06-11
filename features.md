from scratch

create a prd.md file for a CRM that manage suppliers, clients, products, orders, invoices, brands, products categories, professional domain, client daily logs, orders daily logs, reporting and exporting data pdf excel csv

implementing the features listed: 

- authentification page login register
- redirect to dashboard page when login
- header with search bar profile information with dark mode theme switcher
- left sidebar menu for pages routing with hamburger menu off canvas for mobile responsive
- dashboard contain data analysis: total products, total clients, total suppliers, total invoices, total orders, total revenue, growth rate, recent acticity, quick actions to add product, add client, create invoice, add supplier when clicking on quick actions button make appreas the proper popup form to add data
- pages: 
1- suppliers: contain a search bar to search/filter for suppliers by all their data, add supplier button that show popup form to add suppliers data, a list of suppliers showing all their data with sorting and pagination, buttons to view more informations for every supplier and update button that show the same adding form popup, deleting button
2- clients: contain a search bar to search/filter for cleints by all their data, add cleints button that show popup form to add cleint data, a list of cleints showing all their data with sorting and pagination, buttons to view more informations for every cleint and update button that show the same adding form popup, deleting button
3- products: contain a search bar to search/filter for products by all their data, add products button that show popup form to add products data, a list of products showing all their data with sorting and pagination, buttons to view more informations for every products and update button that show the same adding form popup, deleting button
4- orders: contain a search bar to search/filter for orders by all their data, add orders button that show popup form to add orders data, a list of orders showing all their data + status updating dropdown button, add sorting and pagination, buttons to view more informations for every orders and update button that show the same adding form popup, deleting button
5- invoices: contain a search bar to search/filter for invoices by all their data, add invoices button that show popup form to add invoices data, a list of invoices showing all their data with sorting and pagination, buttons to view more informations for every invoices and update button that show the same adding form popup, deleting button
6- professional domains: contain a search bar to search/filter for professional domains by all their data, add a new professional domain button that show popup form to add professional domain data, a list of professional domain showing all their data with sorting and pagination, update button that show the same adding form popup, deleting button
7- Client Daily Logs: contain a search bar to search/filter for Client Daily Logs by all their data, Create Today's Log button that show popup form to add Client Daily Logs data, a list of Client Daily Logs showing all their data date total clients in the today log status closed or  open created by, closet at, actions buttons: view more button, update button that show the same creating form popup,and close button for opened daily log, with sorting and pagination

8- orders Daily Logs: contain a search bar to search/filter for orders Daily Logs by all their data, Create Today's Log button that show popup form to add orders Daily Logs data, a list of orders Daily Logs showing all their data date total orders in the today log total value status closed or  open created by, closet at, actions buttons: view more button, update button that show the same creating form popup,and close button for opened daily log, with sorting and pagination

-forms:
1- suppliers: contain text input form for name, email, adress, phone number
2- clients: dropdown menu for gender shosing Mr.M. Ms.,text input form for First name , Last name, Email, phone number, adress, date picker for birth date, text input for monthly revenue, searchable dropdown menu to select from professional domains data with an add new professional domain button at the right, when chosing professional domain show professional domain code automaticcaly under the form, ccp account number input calculate and show calculated value automatically following the script @ccp-algorithm
3- products: searchable dropdown menu for category and brand with add new button on their right, referance, Description, input text for product name (show result 'product name = category+brand+referance+description' automatically when shoosing category and brand and entering referance and description), text input for buy price, sell price, Quantity
4- orders: searchable dropdown menu for selecting or searching cleints by name email ccp with add new cleint button that show add new client popup form, date picker for choosing the date of the order, order notes text input, add product button that can add products to the order with searchable dropdown menu for selecting or searching for products by their name brand category or referance, text input for quantity and unit price then show the total with deleting button,
5- invoices: searchable dropdown menu for selecting or searching suppliers by name email phone number with add new suppliers button that show add new client popup form, date picker for choosing the date of the invoice, add existing product button that can add products to the invoice with searchable dropdown menu for selecting or searching for products by their name brand category or referance, text input for quantity and unit price then show the total with deleting button, add new product button to show popup form for adding a non existing product to the invoice
6- professionla domains: text input for professional domain name, payment code
7- clients daily logs: 
8- orders daily logs: 



ccp calculation script:
\`\`\`javascript
class CCP {
  constructor(ccp) {
    this.ccp = ccp;
  }

  getCle() {
    // Calculate and return the cle of the account
    const x = this.ccp.padStart(10, "0");
    const values = x.split("");
    let cc = 0;
    let z = 9;

    for (let i = 4; i <= 13; i++) {
      cc += parseInt(values[z]) * i;
      z -= 1;
    }

    const ccc = (cc % 100).toString().padStart(2, "0");
    return ccc;
  }

  calculateRip() {
    // Calculate the rip based on the given value x
    const ccpNum = parseInt(this.ccp);
    const remainder = (ccpNum * 100) % 97;
    let x;

    if (remainder + 85 > 97) {
      x = 97 - (remainder + 85 - 97);
    } else {
      x = 97 - (remainder + 85);
    }

    return "00799999" + ccpNum.toString().padStart(10, "0") + x.toString();
  }

  getRip(onlyCle = false) {
    // Calculate and return the rip of the account
    const rip = this.calculateRip();
    return onlyCle ? rip.slice(-2) : rip;
  }

  getRipCle() {
    // Return only the cle of the rip
    return this.getRip(true).padStart(2, "0");
  }
}
\`\`\`