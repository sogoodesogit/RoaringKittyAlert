const RoaringKitty = require('../RoaringKitty'); //adjust the path according to your project structure

module.exports = async function (context, myTimer) {
    context.log("Timer trigger function executed.");

    if (myTimer.IsPastDue) {
        context.log("Timer function is running late!");
    }

    try {
        await RoaringKitty(context, myTimer);
        context.log("Timer trigger function finished.");
    } catch (error) {
        context.log(`There was an error: ${error.message}`);
    }
};